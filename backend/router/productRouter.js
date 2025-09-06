import express from 'express';
const router = express.Router();
import productController from '../controller/productController.js';
import { checkAuth, checkAdmin } from '../middleware/checkAuth.js';
import { productUpload } from '../middleware/uploadImage.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

// Validation rules
const createProductValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Product description is required'),
    body('category').isMongoId().withMessage('Valid category ID is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    handleValidation
];

const updateProductValidation = [
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Product description cannot be empty'),
    body('category').optional().isMongoId().withMessage('Valid category ID is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    handleValidation
];

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// Protected routes
router.use(checkAuth);

// Vendor routes
router.get('/vendor/my-products', productController.getVendorProducts);
router.post('/', productUpload, createProductValidation, productController.createProduct);
router.put('/:id', productUpload, updateProductValidation, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Product image management
router.delete('/:id/images', productController.removeProductImage);
router.put('/:id/main-image', productController.setMainImage);

// Admin routes
router.get('/admin/pending', checkAdmin, productController.getPendingProducts);
router.patch('/:id/status', checkAdmin, productController.updateProductStatus);

export default router;
