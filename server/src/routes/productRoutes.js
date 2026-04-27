import express from 'express';
import { getAllJerseys, getCollections, addCollection, searchProducts, getProductById, getCategories, getCollectionById, getProductsByCategory, addCategory, addProduct, updateProduct, addProductsBulk, deleteProduct } from '../controllers/productController.js';
import {applyCatalogDiscount,removeCatalogDiscount} from '../controllers/discountController.js';
import { requireAuth } from '../middlewares/authmiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.get('/jerseys', getAllJerseys);
router.get('/collections', getCollections);
router.get('/search', searchProducts)
router.get('/collections/:id',getCollectionById)
// --- NEW ROUTES (Must be above /:id) ---
router.get('/categories', getCategories); 
router.get('/category/:id', getProductsByCategory); 

// --- ADMIN ROUTES ---
router.post('/categories', requireAuth, requireAdmin, addCategory);
router.post('/collections', requireAuth, requireAdmin, addCollection);
router.post('/', requireAuth, requireAdmin, addProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.post('/bulk', requireAuth, requireAdmin, addProductsBulk);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);
router.post('/admin/apply-discount', requireAuth, requireAdmin, applyCatalogDiscount);
router.post('/admin/remove-discount', requireAuth, requireAdmin, removeCatalogDiscount);

// --- DYNAMIC ID ROUTE ---
router.get('/:id', getProductById);

export default router;