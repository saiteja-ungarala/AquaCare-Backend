import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as UtilsController from '../controllers/utils.controller';

const router = Router();

// Require authentication to prevent unauthenticated abuse of the
// Google Maps API key and to control geocoding costs.
router.use(authenticate);

router.get('/geocode', UtilsController.geocode);

export default router;
