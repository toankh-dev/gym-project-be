"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("@/controllers/auth.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
const router = (0, express_1.Router)();
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        error: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),
    (0, express_validator_1.body)('fullName')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Full name must be between 2 and 150 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['MALE', 'FEMALE', 'OTHER'])
        .withMessage('Gender must be MALE, FEMALE, or OTHER'),
];
const loginValidation = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
const forgotPasswordValidation = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),
];
const changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Password confirmation does not match new password');
        }
        return true;
    }),
];
const updateProfileValidation = [
    (0, express_validator_1.body)('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Full name must be between 2 and 150 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['MALE', 'FEMALE', 'OTHER'])
        .withMessage('Gender must be MALE, FEMALE, or OTHER'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Address must not exceed 255 characters'),
    (0, express_validator_1.body)('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),
];
// Public routes (no authentication required)
router.post('/register', authLimiter, registerValidation, validation_middleware_1.validateRequest, auth_controller_1.register);
router.post('/login', loginLimiter, loginValidation, validation_middleware_1.validateRequest, auth_controller_1.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validation_middleware_1.validateRequest, auth_controller_1.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validation_middleware_1.validateRequest, auth_controller_1.resetPassword);
// Public route for token refresh (no rate limiting - handled by token expiry)
router.post('/refresh', auth_controller_1.refreshToken);
// Protected routes (authentication required)
router.use(auth_middleware_1.authenticate); // Apply authentication middleware to all routes below
router.post('/logout', auth_controller_1.logout);
router.post('/change-password', changePasswordValidation, validation_middleware_1.validateRequest, auth_controller_1.changePassword);
router.get('/profile', auth_controller_1.getProfile);
router.put('/profile', updateProfileValidation, validation_middleware_1.validateRequest, auth_controller_1.updateProfile);
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
exports.default = router;
//# sourceMappingURL=auth.routes.js.map