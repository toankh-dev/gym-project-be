import { Router } from 'express';
import { body } from 'express-validator';

import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
} from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validateRequest } from '@/middlewares/validation.middleware';

const router = Router();



// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  body('fullName')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),

  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
];

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),

  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
];

// Public routes (no authentication required)
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);

// Public route for token refresh (no rate limiting - handled by token expiry)
router.post('/refresh', refreshToken);

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication middleware to all routes below

router.post('/logout', logout);
router.post('/change-password', changePasswordValidation, validateRequest, changePassword);
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, validateRequest, updateProfile);

// Route documentation
router.get('/', (_, res) => {
  res.json({
    success: true,
    message: 'Authentication API endpoints',
    endpoints: {
      'POST /register': 'Register a new user account',
      'POST /login': 'Login with email and password',
      'POST /logout': 'Logout and blacklist token (requires auth)',
      'POST /refresh': 'Refresh access token',
      'POST /forgot-password': 'Request password reset',
      'POST /reset-password': 'Reset password with token',
      'POST /change-password': 'Change password (requires auth)',
      'GET /profile': 'Get user profile (requires auth)',
      'PUT /profile': 'Update user profile (requires auth)'
    }
  });
});

export default router;