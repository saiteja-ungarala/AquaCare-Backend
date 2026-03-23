import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
    SignupSchema,
    LoginSchema,
    ForgotPasswordSchema,
    RefreshSchema,
    SendOtpSchema,
    VerifyOtpSchema,
    ResetPasswordSchema,
    SignupInitiateSchema,
    SignupVerifyOtpSchema,
    SignupResendOtpSchema,
    LoginOtpStartSchema,
    LoginOtpResendSchema,
    LoginOtpVerifySchema,
} from '../dto/auth.dto';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

router.post('/signup', validate(SignupSchema), AuthController.signup);
router.post('/signup/initiate', validate(SignupInitiateSchema), AuthController.initiateSignup);
router.post('/signup/verify-otp', validate(SignupVerifyOtpSchema), AuthController.verifySignupOtp);
router.post('/signup/resend-otp', validate(SignupResendOtpSchema), AuthController.resendSignupOtp);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/login/send-otp', validate(LoginOtpStartSchema), AuthController.startLoginOtp);
router.post('/login/resend-otp', validate(LoginOtpResendSchema), AuthController.resendLoginOtp);
router.post('/login/verify-otp', validate(LoginOtpVerifySchema), AuthController.verifyLoginOtp);
router.post('/refresh', validate(RefreshSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', validate(ForgotPasswordSchema), AuthController.forgotPassword);
router.get('/me', authenticate, AuthController.me);
router.post('/send-otp', validate(SendOtpSchema), AuthController.sendOtp);
router.post('/verify-otp', validate(VerifyOtpSchema), AuthController.verifyOtp);
router.post('/reset-password', validate(ResetPasswordSchema), AuthController.resetPassword);

export default router;
