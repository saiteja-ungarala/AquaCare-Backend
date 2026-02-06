import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { CheckoutSchema } from '../dto/order.dto';
import * as OrderController from '../controllers/orders.controller';

const router = Router();

router.use(authenticate);

router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/checkout', validate(CheckoutSchema), OrderController.checkout);

export default router;
