import express from 'express';
const router = express.Router();
import brandController from '../controller/brandController.js';
import { checkAuth } from '../middleware/checkAuth.js';
import { brandUpload } from '../middleware/uploadImage.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validators.js';

// Validation rules
const createBrandValidation = [
    body('name').trim().notEmpty().withMessage('Brand name is required'),
    body('website').optional().isURL().withMessage('Website must be a valid URL'),
    handleValidation
];

const updateBrandValidation = [
    body('name').optional().trim().notEmpty().withMessage('Brand name cannot be empty'),
    body('website').optional().isURL().withMessage('Website must be a valid URL'),
    handleValidation
];

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/select', brandController.getBrandsForSelect);
router.get('/:id', brandController.getBrand);

// Protected routes (Admin only)
router.use(checkAuth);

router.post('/', brandUpload, createBrandValidation, brandController.createBrand);
router.put('/:id', brandUpload, updateBrandValidation, brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

export default router;
