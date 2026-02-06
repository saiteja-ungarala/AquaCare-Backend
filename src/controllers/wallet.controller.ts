import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { successResponse } from '../utils/response';

export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await WalletService.getWallet(userId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await WalletService.getTransactions(userId, req.query);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};
