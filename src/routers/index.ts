import { Router } from 'express';
import AuthRoutes from './auth.routes';
import CatalogRoutes from './catalog.routes';
import CartRoutes from './cart.routes';
import BookingRoutes from './bookings.routes';
import OrderRoutes from './orders.routes';
import WalletRoutes from './wallet.routes';
import ProfileRoutes from './profile.routes';

const router = Router();

router.use('/auth', AuthRoutes);
router.use('/', CatalogRoutes); // /services, /products are root level in spec but grouped in catalog
router.use('/cart', CartRoutes);
router.use('/bookings', BookingRoutes);
router.use('/orders', OrderRoutes);
router.use('/wallet', WalletRoutes);
router.use('/user', ProfileRoutes);

export default router;
