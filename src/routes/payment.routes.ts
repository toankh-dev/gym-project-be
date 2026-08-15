import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { roleGuard } from '@/middlewares/role.middleware';
import { validateRequest } from '@/middlewares/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const paymentController = new PaymentController();

// Validation schemas
const paymentCreateValidation = [
  body('memberId')
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer'),

  body('subscriptionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subscription ID must be a positive integer'),

  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),

  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
    .withMessage('Payment method must be CASH, CARD, BANK_TRANSFER, or MOBILE_PAYMENT'),

  body('paymentType')
    .isIn(['SUBSCRIPTION', 'PERSONAL_TRAINING', 'MERCHANDISE', 'OTHER'])
    .withMessage('Payment type must be SUBSCRIPTION, PERSONAL_TRAINING, MERCHANDISE, or OTHER'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  validateRequest
];

const paymentStatusUpdateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a positive integer'),

  body('status')
    .isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .withMessage('Status must be PENDING, COMPLETED, FAILED, or CANCELLED'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  validateRequest
];

const simulatePaymentValidation = [
  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => {
      if (value <= 0 || value > 10000) {
        throw new Error('Amount must be between 0 and 10,000');
      }
      return true;
    }),

  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
    .withMessage('Payment method must be CASH, CARD, BANK_TRANSFER, or MOBILE_PAYMENT'),

  body('subscriptionId')
    .isInt({ min: 1 })
    .withMessage('Subscription ID must be a positive integer'),

  validateRequest
];

const subscriptionPaymentValidation = [
  body('subscriptionId')
    .isInt({ min: 1 })
    .withMessage('Subscription ID must be a positive integer'),

  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
    .withMessage('Payment method must be CASH, CARD, BANK_TRANSFER, or MOBILE_PAYMENT'),

  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),

  validateRequest
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  validateRequest
];

// Public routes (none for payments - all require authentication)

// Protected routes - require authentication
router.use(authenticate);

// Member routes - accessible by members for their own payments
router.get('/my-payments',
  paginationValidation,
  paymentController.getCurrentMemberPayments
);

// Admin/Staff routes - require admin or staff role
router.get('/',
  roleGuard(['ADMIN', 'STAFF']),
  paginationValidation,
  paymentController.getPayments
);

router.get('/statistics',
  roleGuard(['ADMIN', 'STAFF']),
  paymentController.getPaymentStatistics
);

router.get('/:id',
  roleGuard(['ADMIN', 'STAFF']),
  param('id').isInt({ min: 1 }),
  validateRequest,
  paymentController.getPaymentById
);

router.post('/',
  roleGuard(['ADMIN', 'STAFF']),
  paymentCreateValidation,
  paymentController.createPayment
);

router.patch('/:id/status',
  roleGuard(['ADMIN', 'STAFF']),
  paymentStatusUpdateValidation,
  paymentController.updatePaymentStatus
);

router.get('/member/:memberId',
  roleGuard(['ADMIN', 'STAFF']),
  param('memberId').isInt({ min: 1 }),
  paginationValidation,
  paymentController.getMemberPayments
);

// Payment simulation routes - for testing and development
router.post('/simulate',
  roleGuard(['ADMIN', 'STAFF']),
  simulatePaymentValidation,
  paymentController.simulatePayment
);

// Subscription payment processing
router.post('/subscription/process',
  roleGuard(['ADMIN', 'STAFF']),
  subscriptionPaymentValidation,
  paymentController.processSubscriptionPayment
);

export default router;