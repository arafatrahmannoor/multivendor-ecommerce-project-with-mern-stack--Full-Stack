import { body, param, validationResult } from 'express-validator';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const validateChangePassword = [
  param('id').matches(objectIdRegex).withMessage('Invalid user id'),
  body('currentPassword').isString().isLength({ min: 1 }).withMessage('currentPassword is required'),
  body('newPassword').isString().isLength({ min: 6 }).withMessage('newPassword must be at least 10 chars'),
];

const validateUpdateUser = [
  param('id').matches(objectIdRegex).withMessage('Invalid user id'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('name').optional().isString().isLength({ min: 1 }).withMessage('Invalid name'),
];

const validateIdParam = [
  param('id').matches(objectIdRegex).withMessage('Invalid id'),
];

const validateRegister = [
  body('name').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('role').isIn(['user', 'vendor']),
];

const validateLogin = [
  body('email').isEmail(),
  body('password').isString().notEmpty(),
];

const validateForgotPassword = [
  body('email').isEmail(),
];

const validateResetPassword = [
  param('token').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 10 }),
];

// Simple error formatter
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation error', errors: errors.array() });
  }
  next();
};

export {
  validateChangePassword,
  validateUpdateUser,
  validateIdParam,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  handleValidation,
};
