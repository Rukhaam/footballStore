import express from 'express';
import { getAllJerseys, getCollections, getProductById, getCategories, getProductsByCategory } from '../controllers/productController.js';

const router = express.Router();

router.get('/jerseys', getAllJerseys);
router.get('/collections', getCollections);

// --- NEW ROUTES (Must be above /:id) ---
router.get('/categories', getCategories); 
router.get('/category/:id', getProductsByCategory); 

// --- DYNAMIC ID ROUTE ---
router.get('/:id', getProductById);

export default router;