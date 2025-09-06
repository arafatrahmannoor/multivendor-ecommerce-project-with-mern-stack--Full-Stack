/* eslint-env node */

import express from 'express';
import reviewController from '../controller/reviewController.js';
import { checkAuth } from '../middleware/checkAuth.js';
import { reviewUpload } from '../middleware/uploadImage.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

const router = express.Router();

// Validation rules
const createReviewValidation = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
    body('title').optional().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    handleValidation
];

const updateReviewValidation = [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().notEmpty().withMessage('Comment cannot be empty'),
    body('title').optional().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    handleValidation
];

const vendorReplyValidation = [
    body('comment').trim().notEmpty().withMessage('Reply comment is required'),
    handleValidation
];

const updateStatusValidation = [
    body('status').isIn(['pending', 'approved', 'rejected', 'spam']).withMessage('Invalid status'),
    handleValidation
];

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes
router.use(checkAuth);

// User review routes
router.get('/my-reviews', reviewController.getUserReviews);
router.post('/product/:productId', reviewUpload, createReviewValidation, reviewController.createReview);
router.put('/:id', reviewUpload, updateReviewValidation, reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Review interaction
router.post('/:id/helpful', reviewController.voteHelpful);
router.post('/:id/report', reviewController.reportReview);

// Review image management
router.delete('/:id/images', reviewController.removeReviewImage);

// Vendor reply
router.post('/:id/reply', vendorReplyValidation, reviewController.vendorReply);

// Admin routes
router.get('/admin/all', reviewController.getAllReviews);
router.put('/admin/:id/status', updateStatusValidation, reviewController.updateReviewStatus);

export default router;
