import express from 'express';
import { getCart, addToCart } from '../controllers/cartController.js';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { validateDTO } from '../middlewares/validateMiddleware.js';
import { addToCartDTO } from '../dtos/schemas.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getCart);
router.post('/add', validateDTO(addToCartDTO), addToCart);

export default router;