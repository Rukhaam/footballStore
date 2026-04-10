import express from 'express';
// Add getMyOrders to your imports
import { checkout, verifyPayment, getMyOrders } from '../controllers/orderController.js'; 
import { requireAuth } from '../middlewares/authmiddleware.js';
import { validateDTO } from '../middlewares/validateMiddleware.js';
import { checkoutDTO } from '../dtos/schemas.js';
import { checkoutLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/checkout', checkoutLimiter, validateDTO(checkoutDTO), checkout);
router.post('/verify-payment', verifyPayment);

router.get('/my-orders', requireAuth, getMyOrders);

export default router;