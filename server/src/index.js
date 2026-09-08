import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/db.js';
import { requireAuth } from './middlewares/authmiddleware.js';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kinetic-arena.vercel.app',
    'https://kineticstore.page',
    'https://www.kineticstore.page'
  ],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/', apiLimiter);
app.use('/api/user', userRoutes);
app.use('/api/store', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promo', promoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running, Database connected' });
});
app.get("/api/keep-alive", (req, res) => {
  res.status(200).json({
    status: "awake",
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Arena Server running on port ${PORT}`);
});

export default app;
