import { db } from '../config/db.js';
import { users, cart, cartItems, products } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

const getUserCart = async (supabaseId) => {
  const user = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
  
  // Guard clause to prevent crashes
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
    const { productId, quantity } = req.body; 

    const product = await db.select().from(products).where(eq(products.id, productId));
    if (product.length === 0) return res.status(404).json({ error: "Product not found" });
    const truePrice = product[0].price;

    const currentCart = await getUserCart(req.user.supabaseId);
    
    const existingItem = await db.select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, currentCart.id), eq(cartItems.productId, productId)));

    if (existingItem.length > 0) {
      await db.update(cartItems)
        .set({ 
          quantity: existingItem[0].quantity + quantity,
          priceAtTime: truePrice // Update to latest price just in case it changed
        })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: currentCart.id,
        productId,
        quantity,
        priceAtTime: truePrice // Secure price insertion
      });
    }

    res.status(200).json({ message: "Added to cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to add to cart" });
  }
};