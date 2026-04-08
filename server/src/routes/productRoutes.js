import express from 'express';
import { getAllJerseys, getCollections } from '../controllers/productController.js';

const router = express.Router();


router.get('/jerseys', getAllJerseys);
router.get('/collections', getCollections);

export default router;