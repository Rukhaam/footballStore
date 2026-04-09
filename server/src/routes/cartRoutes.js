import express from 'express';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { getCart, addToCart, updateCartItemQuantity, removeCartItem } from '../controllers/cartController.js';

const router = express.Router();

router.get('/', requireAuth, getCart);
router.post('/add', requireAuth, addToCart);

// --- NEW ROUTES ---
router.put('/update', requireAuth, updateCartItemQuantity);
router.delete('/remove/:productId', requireAuth, removeCartItem);

export default router;