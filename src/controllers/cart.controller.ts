import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { successResponse } from '../utils/response';

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await CartService.getCart(userId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await CartService.addItem(userId, req.body);
        return successResponse(res, result, 'Item added to cart', 201);
    } catch (error) {
        next(error);
    }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const itemId = Number(req.params.id);
        const result = await CartService.updateItem(userId, itemId, req.body);
        return successResponse(res, result, 'Cart item updated');
    } catch (error) {
        next(error);
    }
};

export const removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const itemId = Number(req.params.id);
        const result = await CartService.removeItem(userId, itemId);
        return successResponse(res, result, 'Item removed from cart');
    } catch (error) {
        next(error);
    }
};
