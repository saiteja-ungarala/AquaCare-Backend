import { Router } from 'express';
import * as CatalogController from '../controllers/catalog.controller';

const router = Router();

// Customer catalog endpoints.
// NOTE: `/products` is kept for lightweight catalog compatibility in existing clients.
// Store commerce flows use `/store/products` with richer filtering/pagination.
router.get('/services', CatalogController.getServices);
router.get('/services/:id', CatalogController.getServiceById);
router.get('/products', CatalogController.getProducts);
router.get('/products/:id', CatalogController.getProductById);

export default router;
