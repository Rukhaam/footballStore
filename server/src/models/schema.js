import { pgTable, serial, text, integer, timestamp, varchar, decimal } from "drizzle-orm/pg-core";

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
});

// 3. COLLECTIONS (New Table! e.g., Real Madrid, Man United)
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  collectionName: varchar("collection_name", { length: 100 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"), // Optional: For rendering club crests
});

// 4. PRODUCTS (Jerseys)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  collectionId: integer("collection_id").references(() => collections.id), 
  productImageUrl: text("product_image_url"),
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
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

// 7. ORDERS
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  addressSnapshot: text("address_snapshot").notNull(), // Stores exact address at checkout time
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. ORDER ITEMS
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
});