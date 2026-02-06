import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AddCartItemSchema, UpdateCartItemSchema } from '../dto/cart.dto';
import * as CartController from '../controllers/cart.controller';

const router = Router();

router.use(authenticate);

router.get('/', CartController.getCart);
router.post('/items', validate(AddCartItemSchema), CartController.addItem);
router.patch('/items/:id', validate(UpdateCartItemSchema), CartController.updateItem);
router.delete('/items/:id', CartController.removeItem);

export default router;
