import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/db.js'; 
import { requireAuth } from './middlewares/authmiddleware.js'

// Routes 
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js'
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

import { apiLimiter } from './middlewares/rateLimiter.js'; // <-- Import the general limiter

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use('/api/', apiLimiter);
app.use('/api/user', userRoutes);
app.use('/api/store', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes)


// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running, Database connected' });
});

// Protected Route Example
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});