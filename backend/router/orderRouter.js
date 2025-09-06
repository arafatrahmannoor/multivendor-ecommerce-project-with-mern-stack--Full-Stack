/* eslint-env node */

import express from 'express';
import orderController from '../controller/orderController.js';
import { checkAuth } from '../middleware/checkAuth.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

const router = express.Router();

// Validation rules
const updateOrderStatusValidation = [
    body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
    body('trackingNumber').optional().trim().notEmpty().withMessage('Tracking number cannot be empty'),
    handleValidation
];

const cancelOrderValidation = [
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
    handleValidation
];

const approveOrderValidation = [
    body('adminNotes').optional().trim().isLength({ max: 1000 }).withMessage('Admin notes cannot exceed 1000 characters'),
    handleValidation
];

const rejectOrderValidation = [
    body('rejectionReason').notEmpty().trim().isLength({ min: 10, max: 500 }).withMessage('Rejection reason must be between 10-500 characters'),
    handleValidation
];

const vendorOrderValidation = [
    body('vendorNotes').optional().trim().isLength({ max: 500 }).withMessage('Vendor notes cannot exceed 500 characters'),
    body('rejectionReason').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Rejection reason must be between 10-500 characters'),
    handleValidation
];

// All routes require authentication
router.use(checkAuth);

// User order routes
router.get('/my-orders', orderController.getUserOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id/cancel', cancelOrderValidation, orderController.cancelOrder);

// Vendor order routes
router.get('/vendor/orders', orderController.getVendorOrders);
router.get('/vendor/assigned', orderController.getAssignedOrders);
router.put('/vendor/:id/confirm', vendorOrderValidation, orderController.confirmVendorOrder);
router.put('/vendor/:id/reject', vendorOrderValidation, orderController.rejectVendorOrder);
router.put('/:id/status', updateOrderStatusValidation, orderController.updateOrderStatus);

// Payment routes
router.post('/:id/payment', orderController.initializeOrderPayment);

// Analytics
router.get('/analytics/overview', orderController.getOrderAnalytics);

// Admin routes
router.get('/admin/all', orderController.getAllOrders);
router.get('/admin/pending', orderController.getPendingOrders);
router.put('/admin/:id/approve', approveOrderValidation, orderController.approveOrder);
router.put('/admin/:id/reject', rejectOrderValidation, orderController.rejectOrder);

export default router;
