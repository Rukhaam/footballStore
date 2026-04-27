import express from 'express';
import { optionalAuth } from '../middlewares/authmiddleware.js';
import { getCart, addToCart, updateCartItemQuantity, removeCartItem } from '../controllers/cartController.js';

const router = express.Router();

router.get('/', optionalAuth, getCart);
router.post('/add', optionalAuth, addToCart);

router.put('/update', optionalAuth, updateCartItemQuantity);
router.delete('/remove/:productId', optionalAuth, removeCartItem);

export default router;
