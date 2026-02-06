import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { successResponse } from '../utils/response';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await ProfileService.getProfile(userId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await ProfileService.updateProfile(userId, req.body);
        return successResponse(res, result, 'Profile updated');
    } catch (error) {
        next(error);
    }
};

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await ProfileService.getAddresses(userId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const result = await ProfileService.addAddress(userId, req.body);
        return successResponse(res, result, 'Address added', 201);
    } catch (error) {
        next(error);
    }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const addressId = Number(req.params.id);
        const result = await ProfileService.updateAddress(userId, addressId, req.body);
        return successResponse(res, result, 'Address updated');
    } catch (error) {
        next(error);
    }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const addressId = Number(req.params.id);
        await ProfileService.deleteAddress(userId, addressId);
        return successResponse(res, null, 'Address deleted');
    } catch (error) {
        next(error);
    }
};
