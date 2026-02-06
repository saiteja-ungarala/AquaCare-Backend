import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../utils/response';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.signup({
            ...req.body,
            password_hash: req.body.password // Temporarily map password
        });
        return successResponse(res, result, 'User created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.login(req.body.email, req.body.password);
        return successResponse(res, result, 'Login successful');
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.refreshToken(req.body.refreshToken);
        return successResponse(res, result, 'Token refreshed');
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Expect refresh token in body for now, to revoke specific session
        await AuthService.logout(req.body.refreshToken);
        return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
    // User is attached to req by auth middleware
    return successResponse(res, { user: req.user });
};
