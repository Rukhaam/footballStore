import { db } from '../config/db.js';
import { orders, users, products } from '../models/schema.js';
import { desc } from 'drizzle-orm';

export const getDashboardStats = async (req, res) => {
  try {
    const allOrders = await db.select().from(orders);
    const allUsers = await db.select().from(users);
    const allProducts = await db.select().from(products);

    const revenue = allOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const ordersCount = allOrders.length;
    const usersCount = allUsers.length;
    const productsCount = allProducts.length;

    const salesByDate = {};
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(30);
    recentOrders.reverse().forEach(order => {
      if (!order.createdAt) return;
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = 0;
      }
      salesByDate[dateStr] += Number(order.totalAmount);
    });

    const chartData = {
      labels: Object.keys(salesByDate),
      sales: Object.values(salesByDate)
    };

    res.status(200).json({
      stats: { revenue, orders: ordersCount, products: productsCount, users: usersCount },
      chartData
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};