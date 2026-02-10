import { Router } from 'express';
import * as StoreController from '../controllers/store.controller';

const router = Router();

// GET /store/categories - list active categories
router.get('/categories', StoreController.getCategories);

// GET /store/products - list products with filters
router.get('/products', StoreController.getProducts);

// GET /store/products/:id - product detail
router.get('/products/:id', StoreController.getProductById);

export default router;
