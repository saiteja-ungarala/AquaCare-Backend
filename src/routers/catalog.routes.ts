import { Router } from 'express';
import * as CatalogController from '../controllers/catalog.controller';

const router = Router();

router.get('/services', CatalogController.getServices);
router.get('/services/:id', CatalogController.getServiceById);
router.get('/products', CatalogController.getProducts);
router.get('/products/:id', CatalogController.getProductById);

export default router;
