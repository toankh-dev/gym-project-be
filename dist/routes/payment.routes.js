"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("@/controllers/payment.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const role_middleware_1 = require("@/middlewares/role.middleware");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const paymentController = new payment_controller_1.PaymentController();
// Validation schemas
const paymentCreateValidation = [
    (0, express_validator_1.body)('memberId')
        .isInt({ min: 1 })
        .withMessage('Member ID must be a positive integer'),
    (0, express_validator_1.body)('subscriptionId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Subscription ID must be a positive integer'),
    (0, express_validator_1.body)('amount')
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        if (value <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        return true;
    }),
    (0, express_validator_1.body)('paymentMethod')
        .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
        .withMessage('Payment method must be CASH, CARD, BANK_TRANSFER, or MOBILE_PAYMENT'),
    (0, express_validator_1.body)('paymentType')
        .isIn(['SUBSCRIPTION', 'PERSONAL_TRAINING', 'MERCHANDISE', 'OTHER'])
        .withMessage('Payment type must be SUBSCRIPTION, PERSONAL_TRAINING, MERCHANDISE, or OTHER'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    validation_middleware_1.validateRequest
];
const paymentStatusUpdateValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Payment ID must be a positive integer'),
    (0, express_validator_1.body)('status')
        .isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'])
        .withMessage('Status must be PENDING, COMPLETED, FAILED, or CANCELLED'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    validation_middleware_1.validateRequest
];
const simulatePaymentValidation = [
    (0, express_validator_1.body)('amount')
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        if (value <= 0 || value > 10000) {
            throw new Error('Amount must be between 0 and 10,000');
        }
        return true;
    }),
    (0, express_validator_1.body)('paymentMethod')
        .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
        .withMessage('Payment method must be CASH, CARD, BANK_TRANSFER, or MOBILE_PAYMENT'),
    (0, express_validator_1.body)('subscriptionId')
        .isInt({ min: 1 })
        .withMessage('Subscription ID must be a positive integer'),
    validation_middleware_1.validateRequest
];
const subscriptionPaymentValidation = [
    (0, express_validator_1.body)('subscriptionId')
        .isInt({ min: 1 })
        .withMessage('Subscription ID must be a positive integer'),
    (0, express_validator_1.body)('paymentMethod')
        .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
        .withMessage('Payment method must be CASH, CARD, BANK_TRANSFER, or MOBILE_PAYMENT'),
    (0, express_validator_1.body)('amount')
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        if (value <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        return true;
    }),
    validation_middleware_1.validateRequest
];
const paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validation_middleware_1.validateRequest
];
// Public routes (none for payments - all require authentication)
// Protected routes - require authentication
router.use(auth_middleware_1.authenticate);
// Member routes - accessible by members for their own payments
router.get('/my-payments', paginationValidation, paymentController.getCurrentMemberPayments);
// Admin/Staff routes - require admin or staff role
router.get('/', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), paginationValidation, paymentController.getPayments);
router.get('/statistics', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), paymentController.getPaymentStatistics);
router.get('/:id', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), (0, express_validator_1.param)('id').isInt({ min: 1 }), validation_middleware_1.validateRequest, paymentController.getPaymentById);
router.post('/', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), paymentCreateValidation, paymentController.createPayment);
router.patch('/:id/status', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), paymentStatusUpdateValidation, paymentController.updatePaymentStatus);
router.get('/member/:memberId', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), (0, express_validator_1.param)('memberId').isInt({ min: 1 }), paginationValidation, paymentController.getMemberPayments);
// Payment simulation routes - for testing and development
router.post('/simulate', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), simulatePaymentValidation, paymentController.simulatePayment);
// Subscription payment processing
router.post('/subscription/process', (0, role_middleware_1.roleGuard)(['ADMIN', 'STAFF']), subscriptionPaymentValidation, paymentController.processSubscriptionPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map