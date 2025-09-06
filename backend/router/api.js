import express from 'express';
import { checkAuth } from '../middleware/checkAuth.js';
const router = express.Router();

// Import all routers (still CommonJS -> ESM interop fallback if needed)
import authRouter from './authRouter.js';
import userRouter from './userRouter.js';
import productRouter from './productRouter.js';
import categoryRouter from './categoryRouter.js';
import brandRouter from './brandRouter.js';
import reviewRouter from './reviewRouter.js';
import orderRouter from './orderRouter.js';
import paymentRouter from './paymentRouter.js';
import cartRouter from './cartRouter.js';

// Mount routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/brands', brandRouter);
router.use('/reviews', reviewRouter);
router.use('/orders', orderRouter);
router.use('/payment', paymentRouter);
router.use('/cart', cartRouter);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'E-Commerce API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Debug auth endpoint  
router.get('/debug-auth', checkAuth, (req, res) => {
    res.json({
        success: true,
        message: 'Authentication working',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Legacy API endpoint
router.get('/api', (req, res)=>{
    res.json({message: "API Endpoint"});
});

export default router;