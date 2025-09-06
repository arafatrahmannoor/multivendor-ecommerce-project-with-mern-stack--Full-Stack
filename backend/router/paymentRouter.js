/* eslint-env node */

import express from 'express';
import paymentController from '../controller/paymentController.js';
import { checkAuth } from '../middleware/checkAuth.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

const router = express.Router();

// Validation rules
const initializePaymentValidation = [
    body('useCart').optional().isBoolean().withMessage('useCart must be a boolean'),
    body('items').if(body('useCart').not().equals(true)).isArray({ min: 1 }).withMessage('Items are required when not using cart'),
    body('items').if(body('useCart').not().equals(true)).custom((items) => {
        if (!Array.isArray(items)) return false;
        return items.every(item => 
            item.productId && item.quantity && 
            typeof item.quantity === 'number' && item.quantity > 0
        );
    }).withMessage('Each item must have valid productId and quantity'),
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('shippingAddress.phone').trim().notEmpty().withMessage('Phone number is required'),
    body('shippingAddress.address').trim().notEmpty().withMessage('Address is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.zipCode').trim().notEmpty().withMessage('Zip code is required'),
    body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
    body('paymentMethod').optional().isIn(['sslcommerz', 'cod']).withMessage('Invalid payment method'),
    handleValidation
];

const refundValidation = [
    body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
    body('reason').optional().trim().notEmpty().withMessage('Reason cannot be empty'),
    handleValidation
];

// Protected routes
router.use(checkAuth);

// Payment initialization
router.post('/initialize', initializePaymentValidation, paymentController.initializePayment);

// Payment callbacks (these might be called without authentication by SSLCommerz)
router.post('/success', paymentController.paymentSuccess);
router.post('/failed', paymentController.paymentFailed);
router.post('/cancelled', paymentController.paymentCancelled);

// IPN handler (webhook from SSLCommerz)
router.post('/ipn', paymentController.handleIPN);

// Payment validation
router.get('/validate/:orderNumber', paymentController.validatePayment);

// Admin refund
router.post('/:orderId/refund', refundValidation, paymentController.refundPayment);

export default router;
