/* eslint-env node */

import express from 'express';
import { register, login } from '../controller/authController.js';

const router = express.Router();

// Simplified routes for testing without validation
router.post('/register', register);
router.post('/login', login);

export default router;
