import express from 'express';
const router = express.Router();
import { addUser, getAllUsers, updateUser, deleteUser, getUserById, updateUserProfilePicture, changeUserPassword, banUser, unbanUser } from '../controller/userController.js';
import { debugToken } from '../controller/tokenController.js';
import { checkAdmin } from '../middleware/checkAuth.js';
import matchJWTwithId from '../middleware/matchJWTwithId.js';
import { changePasswordLimiter } from '../middleware/limiters.js';
import { validateChangePassword, validateIdParam, validateUpdateUser, handleValidation } from '../middleware/validators.js';

// Token debug
router.get('/debug-token', debugToken);

// User CRUD
router.post('/add', checkAdmin, addUser);
router.get('/all', checkAdmin, getAllUsers);
router.get('/:id', validateIdParam, handleValidation, matchJWTwithId, getUserById);
router.put('/update/:id', validateUpdateUser, handleValidation, matchJWTwithId, updateUser);
router.delete('/delete/:id', validateIdParam, handleValidation, matchJWTwithId, deleteUser);
router.patch('/profile_picture/:id', validateIdParam, handleValidation, matchJWTwithId, updateUserProfilePicture);

// Admin-only user management
router.patch('/ban/:id', validateIdParam, handleValidation, checkAdmin, banUser);
router.patch('/unban/:id', validateIdParam, handleValidation, checkAdmin, unbanUser);

// Security-sensitive
router.patch('/change_password/:id', validateChangePassword, handleValidation, changePasswordLimiter, matchJWTwithId, changeUserPassword);

export default router;