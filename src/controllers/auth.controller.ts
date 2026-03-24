import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user.model';
import { WalletModel } from '../models/wallet.model';
import { successResponse } from '../utils/response';
import { normalizeRoleValue } from '../utils/technician-domain';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.signup({
            ...req.body,
            password_hash: req.body.password,
        });
        return successResponse(res, result, 'User created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const initiateSignup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.initiateSignupVerification({
            ...req.body,
            password_hash: req.body.password,
        });
        return successResponse(res, result, 'Verification codes sent');
    } catch (error) {
        next(error);
    }
};

export const verifySignupOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionToken, channel, otp } = req.body;
        const result = await AuthService.verifySignupOtp(sessionToken, channel, otp);
        return successResponse(res, result, result.completed ? 'Signup completed' : 'OTP verified');
    } catch (error) {
        next(error);
    }
};

export const verifySignupFirebaseSms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionToken, firebaseIdToken } = req.body;
        const result = await AuthService.verifySignupFirebaseSms(sessionToken, firebaseIdToken);
        return successResponse(res, result, result.completed ? 'Signup completed' : 'SMS verified');
    } catch (error) {
        next(error);
    }
};

export const resendSignupOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionToken, channel } = req.body;
        const result = await AuthService.resendSignupOtp(sessionToken, channel);
        return successResponse(res, result, 'Verification code resent');
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
        await AuthService.logout(req.body.refreshToken);
        return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const user = await UserModel.findById(userId);
        if (!user) {
            throw { type: 'AppError', message: 'User not found', statusCode: 404 };
        }

        await WalletModel.createWallet(userId);

        const sanitizedUser = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone || null,
            role: normalizeRoleValue(user.role),
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
        await AuthService.initiateForgotPassword(email);
        return successResponse(res, null, 'If that email exists a reset link was sent');
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        await AuthService.resetPassword(token, newPassword);
        return successResponse(res, null, 'Password reset successfully');
    } catch (error) {
        next(error);
    }
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone } = req.body;
        await AuthService.sendOTP(phone);
        return successResponse(res, null, 'OTP sent');
    } catch (error) {
        next(error);
    }
};

export const startLoginOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, role } = req.body;
        const result = await AuthService.initiateLoginOtp(phone, role);
        return successResponse(res, result, 'OTP sent');
    } catch (error) {
        next(error);
    }
};

export const resendLoginOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionToken, channel } = req.body;
        const result = await AuthService.resendLoginOtp(sessionToken, channel);
        return successResponse(res, result, 'OTP resent');
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, otp } = req.body;
        const result = await AuthService.loginWithOTP(phone, otp);
        return successResponse(res, result, 'Login successful');
    } catch (error) {
        next(error);
    }
};

export const verifyLoginOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionToken, channel, otp } = req.body;
        const result = await AuthService.verifyLoginOtp(sessionToken, channel, otp);
        return successResponse(res, result, 'Login successful');
    } catch (error) {
        next(error);
    }
};
