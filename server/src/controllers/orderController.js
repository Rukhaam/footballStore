import { db } from '../config/db.js';
import { users, cart, cartItems, orders, orderItems } from '../models/schema.js';
import { eq } from 'drizzle-orm';

export const checkout = async (req, res) => {
  try {
    const { addressSnapshot } = req.body;
    
    const user = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    // Guard clause to prevent crashes
    if (user.length === 0) return res.status(404).json({ error: "User not found" });
    const userId = user[0].id;
    
    const userCart = await db.select().from(cart).where(eq(cart.userId, userId));
    if (userCart.length === 0) return res.status(400).json({ error: "Cart is empty" });
    const cartId = userCart[0].id;
    
    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    if (items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    // Safely calculate totals dealing with decimal strings
    let totalAmount = 0;
    items.forEach(item => { 
      const price = parseFloat(item.priceAtTime);
      totalAmount += (price * item.quantity); 
    });
    
    // Round to 2 decimal places to avoid floating point bugs
    const cleanTotal = (Math.round(totalAmount * 100) / 100).toFixed(2);

    const newOrder = await db.insert(orders).values({
      userId,
      totalAmount: cleanTotal,
      addressSnapshot,
      status: "pending"
    }).returning();

    const orderItemsData = items.map(item => ({
      orderId: newOrder[0].id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtTime
    }));
    
    await db.insert(orderItems).values(orderItemsData);
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));

    res.status(200).json({ message: "Checkout successful", orderId: newOrder[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Checkout failed" });
  }
};