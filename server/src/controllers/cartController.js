import { db } from '../config/db.js';
import { users, cart, cartItems, products, productSizes } from '../models/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const parseInteger = (value) => Number.parseInt(String(value), 10);

const normalizeSize = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'object') {
    return normalizeSize(value.size);
  }

  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      return normalizeSize(JSON.parse(value).size);
    } catch {
      return value.trim().toUpperCase() || null;
    }
  }

  const clean = String(value).trim().toUpperCase();
  return clean ? clean.slice(0, 50) : null;
};

const sizeWhere = (size) => (size ? eq(cartItems.size, size) : isNull(cartItems.size));

const formatCartProduct = (product) => ({
  id: product.id,
  name: product.productName,
  imageUrl: product.productImageUrl
});

const buildGuestCartItem = ({ product, quantity, size }) => ({
  cartItemId: `guest-${product.id}-${size || 'nosize'}`,
  quantity,
  priceAtTime: product.price,
  size,
  product: formatCartProduct(product)
});

const getUserCart = async (supabaseId) => {
  const user = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
  
  if (user.length === 0) throw new HttpError(404, "User record not synced to database yet");
  const userId = user[0].id;

  let userCart = await db.select().from(cart).where(eq(cart.userId, userId));
  if (userCart.length === 0) {
    userCart = await db.insert(cart).values({ userId }).returning();
  }
  return userCart[0];
};

const getProductForCart = async (productId) => {
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) {
    throw new HttpError(404, "Product not found");
  }
  return product;
};

const ensureStockIsAvailable = async ({ product, size, quantity }) => {
  const availableProductStock = Number.parseInt(product.stock, 10) || 0;
  if (quantity > availableProductStock) {
    throw new HttpError(409, `${product.productName} is out of stock for requested quantity.`);
  }

  const sizeRows = await db
    .select()
    .from(productSizes)
    .where(eq(productSizes.productId, product.id));

  if (!sizeRows.length) return;

  if (!size) {
    throw new HttpError(400, `Please select a size for ${product.productName}.`);
  }

  const matchingSize = sizeRows.find((row) => normalizeSize(row.size) === size);
  if (!matchingSize) {
    throw new HttpError(409, `Selected size ${size} is unavailable for ${product.productName}.`);
  }

  const availableSizeStock = Number.parseInt(matchingSize.stock, 10) || 0;
  if (quantity > availableSizeStock) {
    throw new HttpError(409, `Only ${availableSizeStock} unit(s) available for size ${size}.`);
  }
};

const parseCartPayload = (body) => {
  const productId = parseInteger(body?.productId);
  const quantity = parseInteger(body?.quantity ?? 1);
  const size = normalizeSize(body?.size);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new HttpError(400, "Product ID must be a valid positive integer");
  }

  if (!Number.isInteger(quantity)) {
    throw new HttpError(400, "Quantity must be a valid integer");
  }

  return { productId, quantity, size };
};

const handleCartError = (res, error, fallbackMessage) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: error.message || fallbackMessage });
};

export const getCart = async (req, res) => {
  try {
    if (!req.user?.supabaseId) {
      return res.status(200).json([]);
    }

    const currentCart = await getUserCart(req.user.supabaseId);
    const items = await db.select({
      cartItemId: cartItems.id,
      quantity: cartItems.quantity,
      priceAtTime: cartItems.priceAtTime,
      size: cartItems.size,
      product: {
        id: products.id,
        name: products.productName,
        imageUrl: products.productImageUrl
      }
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, currentCart.id));

    res.status(200).json(items);
  } catch (error) {
    return handleCartError(res, error, "Failed to fetch cart");
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size } = parseCartPayload(req.body);
    if (quantity <= 0) {
      throw new HttpError(400, "Quantity must be at least 1");
    }

    const product = await getProductForCart(productId);

    if (!req.user?.supabaseId) {
      await ensureStockIsAvailable({ product, size, quantity });
      return res.status(200).json({
        message: "Added to guest cart",
        guest: true,
        item: buildGuestCartItem({ product, quantity, size })
      });
    }

    const truePrice = product.price;
    const currentCart = await getUserCart(req.user.supabaseId);
    
    const existingItem = await db.select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, currentCart.id), 
          eq(cartItems.productId, productId),
          sizeWhere(size)
        )
      );

    const nextQuantity = existingItem.length > 0
      ? existingItem[0].quantity + quantity
      : quantity;

    await ensureStockIsAvailable({ product, size, quantity: nextQuantity });

    if (existingItem.length > 0) {
      await db.update(cartItems)
        .set({ 
          quantity: existingItem[0].quantity + quantity,
          priceAtTime: truePrice 
        })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: currentCart.id,
        productId,
        size: size || null,
        quantity,
        priceAtTime: truePrice 
      });
    }

    res.status(200).json({ message: "Added to cart" });
  } catch (error) {
    return handleCartError(res, error, "Failed to add to cart");
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity, size } = parseCartPayload(req.body);

    if (!req.user?.supabaseId) {
      return res.status(200).json({ message: "Guest cart updated", guest: true });
    }
    
    const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    if (!userResult.length) return res.status(404).json({ error: "User not found" });
    const internalUserId = userResult[0].id;

    const cartRecord = await db.select().from(cart).where(eq(cart.userId, internalUserId));
    if (!cartRecord.length) return res.status(404).json({ error: "Cart not found" });
    const cartId = cartRecord[0].id;

    if (quantity <= 0) {
      await db.delete(cartItems)
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId), sizeWhere(size)));
    } else {
      const product = await getProductForCart(productId);
      await ensureStockIsAvailable({ product, size, quantity });

      await db.update(cartItems)
        .set({ quantity })
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId), sizeWhere(size)));
    }

    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    return handleCartError(res, error, "Failed to update cart quantity");
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const productId = parseInteger(req.params.productId);
    const size = normalizeSize(req.query?.size ?? req.body?.size);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpError(400, "Product ID must be a valid positive integer");
    }

    if (!req.user?.supabaseId) {
      return res.status(200).json({ message: "Guest cart item removed", guest: true });
    }
    
    const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    if (!userResult.length) return res.status(404).json({ error: "User not found" });
    const internalUserId = userResult[0].id;

    const cartRecord = await db.select().from(cart).where(eq(cart.userId, internalUserId));
    if (!cartRecord.length) return res.status(404).json({ error: "Cart not found" });

    await db.delete(cartItems)
      .where(and(eq(cartItems.cartId, cartRecord[0].id), eq(cartItems.productId, productId), sizeWhere(size)));

    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    return handleCartError(res, error, "Failed to remove item");
  }
};
