import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { users, cart, cartItems, orders, orderItems, products, productSizes, payments } from '../models/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const checkout = async (req, res) => {
  try {
    const { addressSnapshot, customerDetails, cartItems: frontendItems, isGuest } = req.body;
    
    if (!frontendItems || frontendItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let userId = null;
    let cartId = null;

    if (!isGuest && req.user?.supabaseId) {
      let userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
      
      // Auto-healing missing OAuth user during checkout
      if (userResult.length === 0) {
        console.log("Auto-healing missing OAuth user during checkout...");
        userResult = await db.insert(users).values({
          supabaseId: req.user.supabaseId,
          email: req.user.email || 'oauth@kineticarena.com',
          userName: 'Kinetic Athlete'
        }).returning();
      }

      if (userResult.length > 0) {
        userId = userResult[0].id;
        const userCart = await db.select().from(cart).where(eq(cart.userId, userId));
        if (userCart.length > 0) cartId = userCart[0].id;
      }
    }

    let subtotalAmount = 0;
    frontendItems.forEach(item => { 
      subtotalAmount += (parseFloat(item.priceAtTime) * item.quantity); 
    });
    
    const shipping = subtotalAmount > 100 ? 0 : 99.00;
    const cleanTotal = (Math.round((subtotalAmount + shipping) * 100) / 100).toFixed(2);

    // 1. Create DB Transaction
    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values({
        userId, isGuest,
        customerName: customerDetails?.fullName || null,
        customerEmail: customerDetails?.email || null,
        customerPhone: customerDetails?.phone || null,
        totalAmount: cleanTotal, addressSnapshot, status: "pending"
      }).returning();

      for (const item of frontendItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id, productId: item.product.id,
          size: item.product.size || null, quantity: item.quantity, priceAtPurchase: item.priceAtTime
        });

        if (item.product.size) {
          await tx.update(productSizes).set({ stock: sql`${productSizes.stock} - ${item.quantity}` })
            .where(and(eq(productSizes.productId, item.product.id), eq(productSizes.size, item.product.size)));
        }
        await tx.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.product.id));
      }

      if (cartId) await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
      return newOrder;
    });

    // 2. Create Razorpay Order
    const options = {
      amount: Math.round(parseFloat(cleanTotal) * 100), 
      currency: "INR", 
      receipt: `receipt_order_${result.id}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({ 
      message: "Order initiated", 
      dbOrderId: result.id,
      razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID 
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ error: "Checkout failed on the server." });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const orderInfo = await db.select().from(orders).where(eq(orders.id, dbOrderId));
      
      await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, dbOrderId));

      await db.insert(payments).values({
        orderId: dbOrderId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        amount: orderInfo[0].totalAmount
      });

      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    let userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    
    if (userResult.length === 0) {
      console.log("Auto-healing missing OAuth user during order fetch...");
      userResult = await db.insert(users).values({
        supabaseId: req.user.supabaseId,
        email: req.user.email || 'oauth@kineticarena.com',
        userName: 'Kinetic Athlete'
      }).returning();
    }

    const internalUserId = userResult[0].id;

    const myOrders = await db.select().from(orders).where(eq(orders.userId, internalUserId));

    const formattedOrders = await Promise.all(myOrders.map(async (order) => {
      const items = await db.select({
        quantity: orderItems.quantity,
        price: orderItems.priceAtPurchase,
        size: orderItems.size,
        productName: products.productName,
        productImage: products.productImageUrl
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

      return { ...order, items };
    }));

    formattedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};