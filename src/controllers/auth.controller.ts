import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user.model';
import { WalletModel } from '../models/wallet.model';
import { successResponse } from '../utils/response';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.signup({
            ...req.body,
            password_hash: req.body.password
        });
        return successResponse(res, result, 'User created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.login(req.body.email, req.body.password, req.body.role);
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
    try {
        const userId = (req.user as any).id;

        // Fetch full user from DB
        const user = await UserModel.findById(userId);
        if (!user) {
            throw { type: 'AppError', message: 'User not found', statusCode: 404 };
        }

        // Ensure wallet exists for user
        await WalletModel.createWallet(userId);

        // Return sanitized user with camelCase fields
        const sanitizedUser = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone || null,
            role: user.role,
            referralCode: (user as any).referral_code || null,
        };

        return successResponse(res, { user: sanitizedUser });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        // Log the request for future email integration
        console.log(`[Auth] Password reset requested for: ${email}`);

        // Always return success for security (don't leak which emails exist)
        return successResponse(res, null, 'If this email exists, we sent reset instructions.');
    } catch (error) {
        next(error);
    }
};
