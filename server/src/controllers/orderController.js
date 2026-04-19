import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { users, cart, cartItems, orders, orderItems, products, productSizes, payments, promoCodes } from '../models/schema.js';
import { eq, and, sql, inArray, ne } from 'drizzle-orm'; // <-- Added 'ne' here

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const checkout = async (req, res) => {
  try {
    const { addressSnapshot, customerDetails, cartItems: frontendItems, isGuest, promoCode } = req.body;
    
    if (!frontendItems || frontendItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

    let userId = null;
    let cartId = null;

    if (!isGuest && req.user?.supabaseId) {
      const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
      if (userResult.length > 0) {
        userId = userResult[0].id;
        const userCart = await db.select().from(cart).where(eq(cart.userId, userId));
        if (userCart.length > 0) cartId = userCart[0].id;
      }
    }

    const productIds = frontendItems.map(item => item.product.id);
    const trueProducts = await db.select().from(products).where(inArray(products.id, productIds));

    const truePriceMap = {};
    trueProducts.forEach(p => { truePriceMap[p.id] = parseFloat(p.price); });

    let subtotalAmount = 0;
    for (let item of frontendItems) {
      const truePrice = truePriceMap[item.product.id];
      if (truePrice === undefined) return res.status(400).json({ error: `Product ID ${item.product.id} does not exist.` });
      
      subtotalAmount += (truePrice * item.quantity); 
      item.priceAtTime = truePrice; 
    }

    let discountAmount = 0;
    if (promoCode) {
      const upperCode = promoCode.toUpperCase();
      const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, upperCode));

      if (!promo) return res.status(400).json({ error: "Invalid promo code" });
      if (!promo.isActive) return res.status(400).json({ error: "This promo code is no longer active" });
      if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) return res.status(400).json({ error: "This promo code has expired" });
      if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) return res.status(400).json({ error: "This promo code has reached its usage limit" });

      if (promo.discountType === 'fixed' && subtotalAmount <= parseFloat(promo.discountValue)) {
        return res.status(400).json({ error: `Cart subtotal must be greater than ₹${parseFloat(promo.discountValue)} to use this code.` });
      }

      if (promo.discountType === 'percentage') {
        discountAmount = subtotalAmount * (parseFloat(promo.discountValue) / 100);
      } else if (promo.discountType === 'fixed') {
        discountAmount = parseFloat(promo.discountValue);
      }
    }
    
    const shipping = subtotalAmount > 100 ? 0 : 99.00;
    const totalBeforeShipping = Math.max(0, subtotalAmount - discountAmount);
    const cleanTotal = (Math.round((totalBeforeShipping + shipping) * 100) / 100).toFixed(2);

    const result = await db.transaction(async (tx) => {
      // 1. Create the Pending Order
      const [newOrder] = await tx.insert(orders).values({
        userId, isGuest,
        customerName: customerDetails?.fullName || null,
        customerEmail: customerDetails?.email || null,
        customerPhone: customerDetails?.phone || null,
        totalAmount: cleanTotal, addressSnapshot, status: "pending"
      }).returning();

      // 2. Insert Order Items (BUT DO NOT DEDUCT STOCK YET)
      for (const item of frontendItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id, productId: item.product.id,
          size: item.product.size || null, quantity: item.quantity, priceAtPurchase: item.priceAtTime
        });
      }

      if (promoCode) {
        const upperCode = promoCode.toUpperCase();
        await tx.update(promoCodes).set({ currentUses: sql`${promoCodes.currentUses} + 1` }).where(eq(promoCodes.code, upperCode));
      }

      // WE NO LONGER DELETE THE CART HERE!
      return newOrder;
    });

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
      
      // --- THE FIX: DEDUCT STOCK & CLEAR CART ONLY WHEN PAYMENT IS SUCCESSFUL ---
      await db.transaction(async (tx) => {
        
        // 1. Mark as Paid
        await tx.update(orders).set({ status: 'paid' }).where(eq(orders.id, dbOrderId));

        // 2. Deduct Stock
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, dbOrderId));
        for (const item of items) {
          if (item.size) {
            await tx.update(productSizes).set({ stock: sql`${productSizes.stock} - ${item.quantity}` })
              .where(and(eq(productSizes.productId, item.productId), eq(productSizes.size, item.size)));
          }
          await tx.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.productId));
        }

        // 3. Clear the User's Cart
        if (orderInfo[0].userId) {
          const userCart = await tx.select().from(cart).where(eq(cart.userId, orderInfo[0].userId));
          if (userCart.length > 0) {
            await tx.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
          }
        }

        // 4. Record the Payment
        await tx.insert(payments).values({
          orderId: dbOrderId,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
          amount: orderInfo[0].totalAmount
        });
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
    const userResult = await db.select().from(users).where(eq(users.supabaseId, req.user.supabaseId));
    if (!userResult.length) return res.status(404).json({ error: "User not found" });
    const internalUserId = userResult[0].id;

    // THE FIX: Hide 'pending' orders from the user's dashboard!
    const myOrders = await db.select().from(orders).where(
      and(
        eq(orders.userId, internalUserId),
        ne(orders.status, 'pending') // <-- Ignore abandoned checkouts
      )
    );

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

export const getAllOrders = async (req, res) => {
  try {
    // Hide pending orders from Admin Dashboard too!
    const allOrders = await db.select().from(orders).where(ne(orders.status, 'pending'));
    res.status(200).json(allOrders);
  } catch (error) {
    console.error("Fetch All Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await db.update(orders)
      .set({ status: status })
      .where(eq(orders.id, id))
      .returning();

    res.status(200).json({ message: "Status updated successfully", order: updatedOrder[0] });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};