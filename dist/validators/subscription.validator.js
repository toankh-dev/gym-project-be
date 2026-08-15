"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSubscriptionCancel = exports.validateSubscriptionRenewal = exports.validateSubscriptionUpdate = exports.validateSubscription = void 0;
const express_validator_1 = require("express-validator");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
exports.validateSubscription = [
    (0, express_validator_1.body)('memberId')
        .isInt({ min: 1 })
        .withMessage('Member ID must be a positive integer'),
    (0, express_validator_1.body)('packageId')
        .isInt({ min: 1 })
        .withMessage('Package ID must be a positive integer'),
    (0, express_validator_1.body)('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date')
        .custom((value) => {
        const startDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
            throw new Error('Start date cannot be in the past');
        }
        return true;
    }),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'])
        .withMessage('Invalid payment method'),
    validation_middleware_1.validateRequest
];
exports.validateSubscriptionUpdate = [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'])
        .withMessage('Invalid subscription status'),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('actualPrice')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .withMessage('Actual price must be a valid decimal number'),
    validation_middleware_1.validateRequest
];
exports.validateSubscriptionRenewal = [
    (0, express_validator_1.body)('packageId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Package ID must be a positive integer'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'])
        .withMessage('Invalid payment method'),
    validation_middleware_1.validateRequest
];
exports.validateSubscriptionCancel = [
    (0, express_validator_1.body)('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Cancellation reason must not exceed 500 characters'),
    validation_middleware_1.validateRequest
];
//# sourceMappingURL=subscription.validator.js.map