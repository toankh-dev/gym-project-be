import { body, ValidationChain } from 'express-validator';
import { validateRequest } from '@/middlewares/validation.middleware';

export const validateSubscription: any[] = [
  body('memberId')
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer'),

  body('packageId')
    .isInt({ min: 1 })
    .withMessage('Package ID must be a positive integer'),

  body('startDate')
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

  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'])
    .withMessage('Invalid payment method'),

  validateRequest
];

export const validateSubscriptionUpdate: any[] = [
  body('status')
    .optional()
    .isIn(['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'])
    .withMessage('Invalid subscription status'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('actualPrice')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Actual price must be a valid decimal number'),

  validateRequest
];

export const validateSubscriptionRenewal: ValidationChain[] = [
  body('packageId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Package ID must be a positive integer'),

  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET'])
    .withMessage('Invalid payment method'),

  validateRequest
];

export const validateSubscriptionCancel: ValidationChain[] = [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters'),

  validateRequest
];