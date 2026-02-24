import { Router } from 'express';
import * as StoreController from '../controllers/store.controller';
import { validate } from '../middlewares/validate.middleware';
import {
    StoreBrandsByCategorySchema,
    StoreProductByIdSchema,
    StoreProductsQuerySchema,
} from '../dto/store.dto';

const router = Router();

// GET /store/categories - list active categories
router.get('/categories', StoreController.getCategories);

// GET /store/categories/:categoryId/brands - list active brands for active products in category
router.get('/categories/:categoryId/brands', validate(StoreBrandsByCategorySchema), StoreController.getBrandsByCategory);

// GET /store/products - list products with filters
router.get('/products', validate(StoreProductsQuerySchema), StoreController.getProducts);

// GET /store/products/:id - product detail
router.get('/products/:id', validate(StoreProductByIdSchema), StoreController.getProductById);

export default router;
