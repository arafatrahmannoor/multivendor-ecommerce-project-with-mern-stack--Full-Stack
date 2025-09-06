import express from 'express';
const router = express.Router();
import categoryController from '../controller/categoryController.js';
import { checkAuth } from '../middleware/checkAuth.js';
import { categoryUpload } from '../middleware/uploadImage.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

// Validation rules
const createCategoryValidation = [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('serviceCharge').optional().isFloat({ min: 0 }).withMessage('Service charge must be a positive number'),
    handleValidation
];

const updateCategoryValidation = [
    body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
    body('serviceCharge').optional().isFloat({ min: 0 }).withMessage('Service charge must be a positive number'),
    handleValidation
];

const createSubCategoryValidation = [
    body('name').trim().notEmpty().withMessage('Subcategory name is required'),
    body('category').isMongoId().withMessage('Valid category ID is required'),
    handleValidation
];

const updateSubCategoryValidation = [
    body('name').optional().trim().notEmpty().withMessage('Subcategory name cannot be empty'),
    body('category').optional().isMongoId().withMessage('Valid category ID is required'),
    handleValidation
];

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);

// Subcategory routes
router.get('/:categoryId/subcategories', categoryController.getSubCategories);

// Protected routes (Admin only for categories)
router.use(checkAuth);

// Category management
router.post('/', categoryUpload, createCategoryValidation, categoryController.createCategory);
router.put('/:id', categoryUpload, updateCategoryValidation, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Subcategory management
router.post('/subcategories', categoryUpload, createSubCategoryValidation, categoryController.createSubCategory);
router.put('/subcategories/:id', categoryUpload, updateSubCategoryValidation, categoryController.updateSubCategory);
router.delete('/subcategories/:id', categoryController.deleteSubCategory);

export default router;
