/* eslint-env node */

import express from 'express';
import cartController from '../controller/cartController.js';
import { checkAuth } from '../middleware/checkAuth.js';
import { body, param } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

const router = express.Router();

// Validation rules
const addToCartValidation = [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
    body('variant').optional().isObject().withMessage('Variant must be an object'),
    handleValidation
];

const updateCartValidation = [
    param('itemId').isMongoId().withMessage('Valid item ID is required'),
    body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
    handleValidation
];

const removeFromCartValidation = [
    param('itemId').isMongoId().withMessage('Valid item ID is required'),
    handleValidation
];

const checkProductValidation = [
    param('productId').isMongoId().withMessage('Valid product ID is required'),
    handleValidation
];

// All cart routes require authentication
router.use(checkAuth);

// Get user's cart
router.get('/', cartController.getCart);

// Get cart summary (lightweight)
router.get('/summary', cartController.getCartSummary);

// Check if product is in cart
router.get('/check/:productId', checkProductValidation, cartController.checkProductInCart);

// Add item to cart
router.post('/add', addToCartValidation, cartController.addToCart);

// Update cart item quantity
router.put('/update/:itemId', updateCartValidation, cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', removeFromCartValidation, cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

// Move cart to order (used during checkout process)
router.post('/checkout', cartController.moveToOrder);

export default router;
