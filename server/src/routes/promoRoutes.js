import express from 'express';
import { createPromoCode, deletePromoCode, getAllPromoCodes, validatePromoCode } from '../controllers/promoController.js';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.post('/validate-promo', validatePromoCode); 

router.use(requireAuth, requireAdmin);
router.get('/', getAllPromoCodes);
router.post('/', createPromoCode);
router.delete('/:id', deletePromoCode);

export default router;
