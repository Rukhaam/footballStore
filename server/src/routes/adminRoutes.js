import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get('/dashboard', getDashboardStats);

export default router;