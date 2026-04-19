import { pgTable, serial, text, integer, timestamp, varchar, decimal, boolean, jsonb } from "drizzle-orm/pg-core"; 

// 1. USERS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: varchar("supabase_id", { length: 255 }).notNull().unique(), // Links to Supabase Auth
  userName: varchar("user_name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  address: text("address"),
  pincode: varchar("pincode", { length: 10 }),
  phoneNumber: varchar("phone_number", { length: 15 }),
  role: varchar("role", { length: 20 }).default("customer"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. CATEGORIES (e.g., Home Kit, Away Kit, Retro, Training)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  categoryName: varchar("category_name", { length: 100 }).notNull().unique(),
  categoryUrl : text("category_url")
});

// 3. COLLECTIONS (New Table! e.g., Real Madrid, Man United)
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  collectionName: varchar("collection_name", { length: 100 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"), // Optional: For rendering club crests
});

// 4. PRODUCTS (Jerseys)
// 4. PRODUCTS (Jerseys)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), 
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }), 
  stock: integer("stock").default(0).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  collectionId: integer("collection_id").references(() => collections.id), 
  productImageUrl: text("product_image_url"),
  gallery: jsonb("gallery").default([]), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. CART (Persistent Cart Session)
export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. CART ITEMS
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => cart.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  size: varchar("size", { length: 50 }), // <-- EXPANDED TO 50
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

// 7. ORDERS (UPDATED FOR GUEST CHECKOUT)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Removed .notNull() so guests can order!
  isGuest: boolean("is_guest").default(false).notNull(), // Flag to identify guest orders
  customerName: varchar("customer_name", { length: 255 }), // Store guest name
  customerEmail: varchar("customer_email", { length: 255 }), // Store guest email
  customerPhone: varchar("customer_phone", { length: 50 }), // Store guest phone
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  addressSnapshot: text("address_snapshot").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. ORDER ITEMS (UPDATED to include the chosen size)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  size: varchar("size", { length: 50 }), // <-- EXPANDED TO 50
  quantity: integer("quantity").notNull(),
  priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
});

// 9. CONTACTS (NEW TABLE FOR CONTACT US PAGE)
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("Unread").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PRODUCT SIZES
export const productSizes = pgTable("product_sizes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  size: varchar("size", { length: 50 }).notNull(), // <-- EXPANDED TO 50
  stock: integer("stock").default(0).notNull(),
});

// 10. PAYMENTS (NEW TABLE)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }).notNull(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }).notNull(),
  razorpaySignature: varchar("razorpay_signature", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("successful").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. PROMO CODES (NEW TABLE)
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g., 'KINETIC20'
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // e.g., 20 for 20%, or 500 for ₹500 off
  maxUses: integer("max_uses"), // null means unlimited uses
  currentUses: integer("current_uses").default(0).notNull(),
  expiresAt: timestamp("expires_at"), // null means never expires
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});