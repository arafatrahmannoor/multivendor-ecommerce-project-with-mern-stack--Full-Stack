import express from 'express';
import { register, login, forgotPassword, resetPassword } from '../controller/authController.js';
import rateLimit from 'express-rate-limit';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, handleValidation } from '../middleware/validators.js';
const router = express.Router();


router.post('/register', validateRegister, handleValidation, register);
router.post('/login', validateLogin, handleValidation, login);

// Limit password reset requests (email-based) to mitigate abuse
const forgotLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/forgot-password', validateForgotPassword, handleValidation, forgotLimiter, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, handleValidation, resetPassword);

export default router;