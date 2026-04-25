import { db } from '../config/db.js';
import { users, cart, cartItems, products } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

const getUserCart = async (supabaseId) => {
  const user = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
  
  if (user.length === 0) throw new Error("User record not synced to database yet");
  const userId = user[0].id;

  let userCart = await db.select().from(cart).where(eq(cart.userId, userId));
  if (userCart.length === 0) {
    userCart = await db.insert(cart).values({ userId }).returning();
  }
  return userCart[0];
};

export const getCart = async (req, res) => {
  try {
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
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch cart" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body; 

    const product = await db.select().from(products).where(eq(products.id, productId));
    if (product.length === 0) return res.status(404).json({ error: "Product not found" });
    const truePrice = product[0].price;

    const currentCart = await getUserCart(req.user.supabaseId);
    
    const existingItem = await db.select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, currentCart.id), 
          eq(cartItems.productId, productId),
          size ? eq(cartItems.size, size) : true 
        )
      );

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
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to add to cart" });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    if (!userResult.length) return res.status(404).json({ error: "User not found" });
    const internalUserId = userResult[0].id;

    const cartRecord = await db.select().from(cart).where(eq(cart.userId, internalUserId));
    if (!cartRecord.length) return res.status(404).json({ error: "Cart not found" });
    const cartId = cartRecord[0].id;

    if (quantity <= 0) {
      await db.delete(cartItems)
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
    } else {
      await db.update(cartItems)
        .set({ quantity })
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
    }

    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ error: "Failed to update cart quantity" });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    if (!userResult.length) return res.status(404).json({ error: "User not found" });
    const internalUserId = userResult[0].id;

    const cartRecord = await db.select().from(cart).where(eq(cart.userId, internalUserId));
    if (!cartRecord.length) return res.status(404).json({ error: "Cart not found" });

    await db.delete(cartItems)
      .where(and(eq(cartItems.cartId, cartRecord[0].id), eq(cartItems.productId, parseInt(productId))));

    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove Item Error:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
};