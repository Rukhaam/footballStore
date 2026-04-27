import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { users, cart, cartItems, orders, orderItems, products, productSizes, payments, promoCodes } from '../models/schema.js';
import { eq, and, sql, inArray, ne, gte } from 'drizzle-orm';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const parseInteger = (value) => Number.parseInt(String(value), 10);

const normalizeSize = (value) => {
  if (value === null || value === undefined) return null;
  const clean = String(value).trim().toUpperCase();
  return clean ? clean.slice(0, 50) : null;
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
};

const sanitizeCustomerDetails = (customerDetails) => {
  const fullName = String(customerDetails?.fullName || '').trim();
  const email = String(customerDetails?.email || '').trim().toLowerCase();
  const phone = String(customerDetails?.phone || '').trim();
  const address = String(customerDetails?.address || '').trim();
  const city = String(customerDetails?.city || '').trim();
  const postalCode = String(customerDetails?.postalCode || '').trim();

  if (fullName.length < 2 || fullName.length > 100) {
    throw new HttpError(400, 'Please provide a valid full name.');
  }

  if (!isValidEmail(email)) {
    throw new HttpError(400, 'Please provide a valid email address.');
  }

  if (phone.length < 7 || phone.length > 20) {
    throw new HttpError(400, 'Please provide a valid phone number.');
  }

  if (address.length < 5 || address.length > 120) {
    throw new HttpError(400, 'Please provide a valid shipping address.');
  }

  if (city.length < 2 || city.length > 60) {
    throw new HttpError(400, 'Please provide a valid city.');
  }

  if (postalCode.length < 3 || postalCode.length > 20) {
    throw new HttpError(400, 'Please provide a valid postal code.');
  }

  return { fullName, email, phone, address, city, postalCode };
};

const normalizeCheckoutItems = (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, 'Cart is empty');
  }

  return rawItems.map((item, index) => {
    const itemNo = index + 1;
    const productId = parseInteger(item?.product?.id ?? item?.productId ?? item?.id);
    const quantity = parseInteger(item?.quantity);
    const size = normalizeSize(item?.product?.size ?? item?.size);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpError(400, `Invalid product on cart item #${itemNo}.`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, `Invalid quantity on cart item #${itemNo}.`);
    }

    return { productId, quantity, size };
  });
};

const buildAddressSnapshot = ({ fullName, address, city, postalCode, phone }) => {
  return `${fullName}, ${address}, ${city}, ${postalCode}. Phone: ${phone}`;
};

const buildRequestMaps = (items) => {
  const productQtyMap = new Map();
  const sizeQtyMap = new Map();

  for (const item of items) {
    const currentProductQty = productQtyMap.get(item.productId) || 0;
    productQtyMap.set(item.productId, currentProductQty + item.quantity);

    if (item.size) {
      const sizeKey = `${item.productId}:${item.size}`;
      const currentSizeQty = sizeQtyMap.get(sizeKey) || 0;
      sizeQtyMap.set(sizeKey, currentSizeQty + item.quantity);
    }
  }

  return { productQtyMap, sizeQtyMap };
};

const validateAndPriceItems = async (items) => {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));

  if (dbProducts.length !== productIds.length) {
    const foundIds = new Set(dbProducts.map((p) => p.id));
    const missingId = productIds.find((id) => !foundIds.has(id));
    throw new HttpError(400, `Product ID ${missingId} does not exist.`);
  }

  const productMap = new Map(dbProducts.map((product) => [product.id, product]));
  const { productQtyMap, sizeQtyMap } = buildRequestMaps(items);

  const sizeRows = await db
    .select({ productId: productSizes.productId, size: productSizes.size, stock: productSizes.stock })
    .from(productSizes)
    .where(inArray(productSizes.productId, productIds));

  const productsWithSizes = new Set(sizeRows.map((row) => row.productId));
  for (const item of items) {
    if (productsWithSizes.has(item.productId) && !item.size) {
      const product = productMap.get(item.productId);
      throw new HttpError(400, `Please select a size for ${product.productName}.`);
    }
  }

  for (const [productId, requestedQty] of productQtyMap.entries()) {
    const product = productMap.get(productId);
    const availableStock = Number.parseInt(product.stock, 10) || 0;
    if (requestedQty > availableStock) {
      throw new HttpError(409, `${product.productName} is out of stock for requested quantity.`);
    }
  }

  if (sizeQtyMap.size > 0) {
    const sizeStockMap = new Map(
      sizeRows.map((row) => [`${row.productId}:${normalizeSize(row.size)}`, Number.parseInt(row.stock, 10) || 0])
    );

    for (const [sizeKey, requestedQty] of sizeQtyMap.entries()) {
      const availableStock = sizeStockMap.get(sizeKey);
      if (availableStock === undefined) {
        throw new HttpError(409, `Selected size is unavailable for item ${sizeKey}.`);
      }
      if (requestedQty > availableStock) {
        throw new HttpError(409, `Selected size has insufficient stock for item ${sizeKey}.`);
      }
    }
  }

  let subtotalAmount = 0;
  const pricedItems = items.map((item) => {
    const product = productMap.get(item.productId);
    const truePrice = Number.parseFloat(product.price);
    subtotalAmount += truePrice * item.quantity;

    return {
      ...item,
      productName: product.productName,
      priceAtTime: truePrice,
    };
  });

  return { pricedItems, subtotalAmount };
};

const resolveDiscount = async (promoCode, subtotalAmount) => {
  if (!promoCode || !String(promoCode).trim()) {
    return { discountAmount: 0, normalizedPromoCode: null };
  }

  const normalizedPromoCode = String(promoCode).trim().toUpperCase();
  const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, normalizedPromoCode));

  if (!promo) throw new HttpError(400, 'Invalid promo code');
  if (!promo.isActive) throw new HttpError(400, 'This promo code is no longer active');
  if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
    throw new HttpError(400, 'This promo code has expired');
  }
  if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
    throw new HttpError(400, 'This promo code has reached its usage limit');
  }

  const discountValue = Number.parseFloat(promo.discountValue);
  if (promo.discountType === 'fixed' && subtotalAmount <= discountValue) {
    throw new HttpError(400, `Cart subtotal must be greater than INR ${discountValue} to use this code.`);
  }

  let discountAmount = 0;
  if (promo.discountType === 'percentage') {
    discountAmount = subtotalAmount * (discountValue / 100);
  } else if (promo.discountType === 'fixed') {
    discountAmount = discountValue;
  }

  return { discountAmount, normalizedPromoCode };
};

const decrementInventory = async (tx, items) => {
  const { productQtyMap, sizeQtyMap } = buildRequestMaps(items);

  for (const [sizeKey, quantity] of sizeQtyMap.entries()) {
    const [productIdRaw, size] = sizeKey.split(':');
    const productId = parseInteger(productIdRaw);

    const updatedSizeRow = await tx
      .update(productSizes)
      .set({ stock: sql`${productSizes.stock} - ${quantity}` })
      .where(
        and(
          eq(productSizes.productId, productId),
          sql`upper(${productSizes.size}) = ${size}`,
          gte(productSizes.stock, quantity)
        )
      )
      .returning({ id: productSizes.id });

    if (!updatedSizeRow.length) {
      throw new HttpError(409, `Insufficient stock for size ${size}.`);
    }
  }

  for (const [productId, quantity] of productQtyMap.entries()) {
    const updatedProduct = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${quantity}` })
      .where(and(eq(products.id, productId), gte(products.stock, quantity)))
      .returning({ id: products.id });

    if (!updatedProduct.length) {
      throw new HttpError(409, `Insufficient stock for product ${productId}.`);
    }
  }
};

export const checkout = async (req, res) => {
  try {
    const { customerDetails, cartItems: frontendItems, promoCode } = req.body;
    const normalizedItems = normalizeCheckoutItems(frontendItems);
    const cleanCustomerDetails = sanitizeCustomerDetails(customerDetails);

    let userId = null;
    if (req.user?.supabaseId) {
      const userResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.supabaseId, req.user.supabaseId));

      if (!userResult.length) {
        throw new HttpError(404, 'Authenticated user profile not found. Please sign in again.');
      }

      userId = userResult[0].id;
    }

    const { pricedItems, subtotalAmount } = await validateAndPriceItems(normalizedItems);
    const { discountAmount, normalizedPromoCode } = await resolveDiscount(promoCode, subtotalAmount);

    const shipping = subtotalAmount > 100 ? 0 : 99.00;
    const totalBeforeShipping = Math.max(0, subtotalAmount - discountAmount);
    const cleanTotal = Number((Math.round((totalBeforeShipping + shipping) * 100) / 100).toFixed(2));
    const addressSnapshot = buildAddressSnapshot(cleanCustomerDetails);

    const newOrder = await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values({
        userId,
        isGuest: !userId,
        customerName: cleanCustomerDetails.fullName,
        customerEmail: cleanCustomerDetails.email,
        customerPhone: cleanCustomerDetails.phone,
        totalAmount: cleanTotal.toFixed(2),
        addressSnapshot,
        status: 'pending'
      }).returning();

      for (const item of pricedItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtTime,
        });
      }

      if (normalizedPromoCode) {
        await tx
          .update(promoCodes)
          .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
          .where(eq(promoCodes.code, normalizedPromoCode));
      }

      return newOrder;
    });

    const options = {
      amount: Math.round(parseFloat(cleanTotal) * 100), 
      currency: "INR",
      receipt: `receipt_order_${newOrder.id}`,
      notes: {
        dbOrderId: String(newOrder.id),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({ 
      message: "Order initiated", 
      dbOrderId: newOrder.id,
      razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID 
    });

  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Checkout Error:", error);
    res.status(500).json({ error: "Checkout failed on the server." });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpError(400, 'Missing payment verification details.');
    }

    const parsedOrderId = parseInteger(dbOrderId);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      throw new HttpError(400, 'Invalid order id for verification.');
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      throw new HttpError(400, 'Invalid payment signature');
    }

    const [existingOrder] = await db.select().from(orders).where(eq(orders.id, parsedOrderId));
    if (!existingOrder) {
      throw new HttpError(404, 'Order not found');
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedReceipt = `receipt_order_${parsedOrderId}`;
    const expectedAmountInPaise = Math.round(Number.parseFloat(existingOrder.totalAmount) * 100);

    if (razorpayOrder.receipt !== expectedReceipt) {
      throw new HttpError(400, 'Payment does not match this order.');
    }

    if (Number(razorpayOrder.amount) !== expectedAmountInPaise) {
      throw new HttpError(400, 'Paid amount does not match order total.');
    }

    const result = await db.transaction(async (tx) => {
      const [lockedOrder] = await tx
        .update(orders)
        .set({ status: 'paid' })
        .where(and(eq(orders.id, parsedOrderId), eq(orders.status, 'pending')))
        .returning();

      if (!lockedOrder) {
        const [currentOrder] = await tx.select().from(orders).where(eq(orders.id, parsedOrderId));

        if (currentOrder?.status === 'paid') {
          return { alreadyVerified: true };
        }

        throw new HttpError(409, `Order cannot be verified from status ${currentOrder?.status || 'unknown'}.`);
      }

      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, parsedOrderId));
      if (!items.length) {
        throw new HttpError(400, 'Order has no items to verify.');
      }

      await decrementInventory(tx, items);

      if (lockedOrder.userId) {
        const userCart = await tx.select().from(cart).where(eq(cart.userId, lockedOrder.userId));
        if (userCart.length > 0) {
          await tx.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
        }
      }

      const existingPayment = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.razorpayPaymentId, razorpay_payment_id));

      if (!existingPayment.length) {
        await tx.insert(payments).values({
          orderId: parsedOrderId,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
          amount: lockedOrder.totalAmount,
          status: 'successful',
        });
      }

      return { alreadyVerified: false };
    });

    return res.status(200).json({
      message: result.alreadyVerified ? 'Payment already verified' : 'Payment verified successfully',
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

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

export const getOrderByIdForAdmin = async (req, res) => {
  try {
    const orderId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order id' });
    }

    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!orderResult.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];

    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      size: orderItems.size,
      priceAtPurchase: orderItems.priceAtPurchase,
      productId: products.id,
      productName: products.productName,
      productImageUrl: products.productImageUrl
    })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    let userProfile = null;
    if (order.userId) {
      const userResult = await db.select({
        id: users.id,
        userName: users.userName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        address: users.address,
        pincode: users.pincode
      })
        .from(users)
        .where(eq(users.id, order.userId));

      userProfile = userResult[0] || null;
    }

    res.status(200).json({
      ...order,
      items,
      customer: {
        name: order.customerName || userProfile?.userName || null,
        email: order.customerEmail || userProfile?.email || null,
        phone: order.customerPhone || userProfile?.phoneNumber || null,
        addressSnapshot: order.addressSnapshot || userProfile?.address || null,
        pincode: userProfile?.pincode || null
      }
    });
  } catch (error) {
    console.error('Fetch Order Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = parseInteger(req.params.id);
    const status = String(req.body?.status || '').trim().toLowerCase();

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order id' });
    }

    const allowedStatuses = new Set(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']);
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const updatedOrder = await db.update(orders)
      .set({ status: status })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: "Status updated successfully", order: updatedOrder[0] });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};
