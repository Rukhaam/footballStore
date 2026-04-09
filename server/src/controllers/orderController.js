import { db } from '../config/db.js';
import { users, cart, cartItems, orders, orderItems, products, productSizes } from '../models/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export const checkout = async (req, res) => {
  try {
    const { addressSnapshot, customerDetails, cartItems: frontendItems, isGuest } = req.body;
    
    // 1. Guard against empty cart
    if (!frontendItems || frontendItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty or stripped by middleware" });
    }

    let userId = null;
    let cartId = null;

    // 2. Identify the User (If NOT a guest)
    if (!isGuest && req.user?.supabaseId) {
      const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
      
      if (userResult.length > 0) {
        userId = userResult[0].id;
        
        const userCart = await db.select().from(cart).where(eq(cart.userId, userId));
        if (userCart.length > 0) {
          cartId = userCart[0].id;
        }
      }
    }

    // 3. Calculate Totals safely
    let subtotalAmount = 0;
    frontendItems.forEach(item => { 
      const price = parseFloat(item.priceAtTime);
      subtotalAmount += (price * item.quantity); 
    });
    
    const shipping = subtotalAmount > 100 ? 0 : 15.00;
    const totalAmount = subtotalAmount + shipping;
    const cleanTotal = (Math.round(totalAmount * 100) / 100).toFixed(2);

    // 4. DATABASE TRANSACTION
    const result = await db.transaction(async (tx) => {
      
      const [newOrder] = await tx.insert(orders).values({
        userId: userId, 
        isGuest: isGuest,
        customerName: customerDetails?.fullName || null,
        customerEmail: customerDetails?.email || null,
        customerPhone: customerDetails?.phone || null,
        totalAmount: cleanTotal,
        addressSnapshot: addressSnapshot,
        status: "pending"
      }).returning();

      for (const item of frontendItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.product.id,
          size: item.product.size || null, 
          quantity: item.quantity,
          priceAtPurchase: item.priceAtTime
        });

        if (item.product.size) {
          await tx.update(productSizes)
            .set({ stock: sql`${productSizes.stock} - ${item.quantity}` })
            .where(
              and(
                eq(productSizes.productId, item.product.id),
                eq(productSizes.size, item.product.size)
              )
            );
        }

        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.product.id));
      }

      if (cartId) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
      }

      return newOrder;
    });

    res.status(200).json({ message: "Checkout successful", orderId: result.id });

  } catch (error) {
    console.error("Checkout Process Error:", error);
    res.status(500).json({ error: "Checkout failed on the server." });
  }
};