// server/src/routes/userRoutes.js
import express from 'express';
import { getUserProfile, updateUserProfile, checkEmailExists } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { validateDTO } from '../middlewares/validateMiddleware.js';
import { updateUserProfileDTO } from '../dtos/schemas.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/check-email/:email', apiLimiter, checkEmailExists);

// PROTECTED ROUTES
router.use(requireAuth);
router.get('/profile', getUserProfile);
router.put('/profile', validateDTO(updateUserProfileDTO), updateUserProfile);

export default router;