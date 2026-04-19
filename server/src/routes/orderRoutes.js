import express from 'express';
// Add getMyOrders to your imports
import { checkout, verifyPayment, getMyOrders, getAllOrders, updateOrderStatus } from '../controllers/orderController.js'; 
import { validatePromoCode } from '../controllers/promoController.js';
import { requireAuth,optionalAuth } from '../middlewares/authmiddleware.js';
import { validateDTO } from '../middlewares/validateMiddleware.js';
import { checkoutDTO } from '../dtos/schemas.js';
import { checkoutLimiter } from '../middlewares/rateLimiter.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Add this route ABOVE your /checkout route
router.post('/validate-promo', validatePromoCode);
router.post('/checkout', checkoutLimiter, optionalAuth, validateDTO(checkoutDTO), checkout);
router.post('/verify-payment', verifyPayment);

router.get('/my-orders', requireAuth, getMyOrders);

router.get('/', requireAuth, requireAdmin, getAllOrders);
router.put('/:id/status', requireAuth, requireAdmin, updateOrderStatus);

export default router;