import express from 'express';
import { checkout } from '../controllers/orderController.js';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { validateDTO } from '../middlewares/validateMiddleware.js';
import { checkoutDTO } from '../dtos/schemas.js';
import { checkoutLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();
router.use(requireAuth);

router.post('/checkout',checkoutLimiter, validateDTO(checkoutDTO), checkout);

export default router;