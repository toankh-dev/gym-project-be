import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getMembers,
  getMemberById,
  getMemberByCode,
  createMember,
  updateMember,
  deleteMember,
  getMemberStatistics,
  assignTrainer,
  removeTrainer,
  getMembersByTrainer,
  getCurrentMember,
  getMyPreferences,
  updateMyPreferences,
  getMyDashboard,
  getMySchedules,
  getMyAttendance,
  getMyPayments,
  bookMySchedule,
  cancelMyBooking
} from '@/controllers/member.controller';
import { authenticate, authorize, selfOrAdmin } from '@/middlewares/auth.middleware';
import { validateRequest } from '@/middlewares/validation.middleware';

const router = Router();

// Authentication required for all routes
router.use(authenticate);

// Validation rules
const memberValidation = [
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

  body('fullName')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),

  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      if (!isNaN(new Date(value).getTime())) return true;
      // Also support DD/MM/YYYY
      const parts = String(value).split(/[\/\-]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        return !isNaN(new Date(y, m, d).getTime());
      }
      return false;
    })
    .withMessage('Please provide a valid date of birth'),

  body('joinDate')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      if (!isNaN(new Date(value).getTime())) return true;
      const parts = String(value).split(/[\/\-]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        return !isNaN(new Date(y, m, d).getTime());
      }
      return false;
    })
    .withMessage('Please provide a valid join date'),

  body('assignedTrainerId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Assigned trainer ID must be a positive integer'),

  body('packageId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Package ID must be a positive integer'),

  body('heightCm')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm'),

  body('weightKg')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),

  body('trainingLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('Training level must be BEGINNER, INTERMEDIATE, or ADVANCED'),

  body('membershipStatus')
    .optional()
    .isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'])
    .withMessage('Membership status must be ACTIVE, EXPIRED, SUSPENDED, or CANCELLED')
];

const updateMemberValidation = [
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'LOCKED'])
    .withMessage('Status must be ACTIVE, INACTIVE, or LOCKED'),

  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),

  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),

  body('membershipStatus')
    .optional()
    .isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'])
    .withMessage('Membership status must be ACTIVE, EXPIRED, SUSPENDED, or CANCELLED'),

  body('assignedTrainerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned trainer ID must be a positive integer'),

  body('heightCm')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm'),

  body('weightKg')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),

  body('trainingLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('Training level must be BEGINNER, INTERMEDIATE, or ADVANCED')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const memberCodeValidation = [
  param('memberCode')
    .matches(/^M\d{6}$/)
    .withMessage('Member code must be in format M######')
];

const trainerIdValidation = [
  param('trainerId')
    .isInt({ min: 1 })
    .withMessage('Trainer ID must be a positive integer')
];

const assignTrainerValidation = [
  body('trainerId')
    .isInt({ min: 1 })
    .withMessage('Trainer ID must be a positive integer')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('status')
    .optional({ checkFalsy: true })
    .isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'])
    .withMessage('Status must be ACTIVE, EXPIRED, SUSPENDED, or CANCELLED'),

  query('trainerId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Trainer ID must be a positive integer'),

  query('sortBy')
    .optional({ checkFalsy: true })
    .isIn(['joinDate', 'memberCode', 'membershipStatus', 'createdAt'])
    .withMessage('Sort by must be joinDate, memberCode, membershipStatus, or createdAt'),

  query('sortOrder')
    .optional({ checkFalsy: true })
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes

// GET /api/members - Get all members (Admin/Staff only)
router.get(
  '/',
  authorize('ADMIN', 'STAFF'),
  queryValidation,
  validateRequest,
  getMembers
);

// GET /api/members/statistics - Get member statistics (Admin/Staff only)
router.get(
  '/statistics',
  authorize('ADMIN', 'STAFF'),
  getMemberStatistics
);

// GET /api/members/me - Get current member's profile (Member only)
router.get(
  '/me',
  authorize('MEMBER'),
  getCurrentMember
);

// Preferences validation
const preferencesValidation = [
  body('notifyEmail').optional().isBoolean().withMessage('notifyEmail must be a boolean'),
  body('notifySms').optional().isBoolean().withMessage('notifySms must be a boolean'),
  body('notifyPush').optional().isBoolean().withMessage('notifyPush must be a boolean'),
  body('notifyWorkoutReminders').optional().isBoolean().withMessage('notifyWorkoutReminders must be a boolean'),
  body('notifySubscriptionExpiry').optional().isBoolean().withMessage('notifySubscriptionExpiry must be a boolean'),
  body('notifyTrainerMessages').optional().isBoolean().withMessage('notifyTrainerMessages must be a boolean'),
  body('profileVisibility')
    .optional()
    .isIn(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'])
    .withMessage('profileVisibility must be PUBLIC, MEMBERS_ONLY, or PRIVATE'),
  body('showProgress').optional().isBoolean().withMessage('showProgress must be a boolean'),
  body('showStats').optional().isBoolean().withMessage('showStats must be a boolean')
];

// GET /api/members/me/preferences - Get current member's preferences (Member only)
router.get(
  '/me/preferences',
  authorize('MEMBER'),
  getMyPreferences
);

// PUT /api/members/me/preferences - Update current member's preferences (Member only)
router.put(
  '/me/preferences',
  authorize('MEMBER'),
  preferencesValidation,
  validateRequest,
  updateMyPreferences
);

// GET /api/members/me/dashboard - aggregated dashboard for current member
router.get('/me/dashboard', authorize('MEMBER'), getMyDashboard);

// GET /api/members/me/schedules - paginated schedule_members rows
router.get('/me/schedules', authorize('MEMBER'), getMySchedules);

// GET /api/members/me/attendance - attendance logs + daily series + stats
router.get('/me/attendance', authorize('MEMBER'), getMyAttendance);

// GET /api/members/me/payments - payment history
router.get('/me/payments', authorize('MEMBER'), getMyPayments);

// POST /api/members/me/schedules/:scheduleId/book - book a future schedule
router.post('/me/schedules/:scheduleId/book', authorize('MEMBER'), bookMySchedule);

// DELETE /api/members/me/schedules/:scheduleId/booking - cancel a booking
router.delete('/me/schedules/:scheduleId/booking', authorize('MEMBER'), cancelMyBooking);

// GET /api/members/trainer/:trainerId - Get members by trainer (Admin/Staff/Trainer for own)
router.get(
  '/trainer/:trainerId',
  trainerIdValidation,
  queryValidation,
  validateRequest,
  authorize('ADMIN', 'STAFF', 'TRAINER'),
  getMembersByTrainer
);

// GET /api/members/code/:memberCode - Get member by member code
router.get(
  '/code/:memberCode',
  memberCodeValidation,
  validateRequest,
  authorize('ADMIN', 'STAFF', 'TRAINER'),
  getMemberByCode
);

// GET /api/members/:id - Get member by ID
router.get(
  '/:id',
  idValidation,
  validateRequest,
  authorize('ADMIN', 'STAFF', 'TRAINER'),
  selfOrAdmin((req) => {
    // For members, they can only access their own data
    if (req.user?.role.name === 'MEMBER') {
      // Find member by user_id and compare with requested id
      return parseInt(req.params.id); // This would need additional logic
    }
    return parseInt(req.params.id);
  }),
  getMemberById
);

// POST /api/members - Create new member (Admin/Staff only)
router.post(
  '/',
  authorize('ADMIN', 'STAFF'),
  memberValidation,
  validateRequest,
  createMember
);

// PUT /api/members/:id - Update member (Admin/Staff only)
router.put(
  '/:id',
  authorize('ADMIN', 'STAFF'),
  idValidation,
  updateMemberValidation,
  validateRequest,
  updateMember
);

// DELETE /api/members/:id - Delete member (Admin only)
router.delete(
  '/:id',
  authorize('ADMIN'),
  idValidation,
  validateRequest,
  deleteMember
);

// PUT /api/members/:id/assign-trainer - Assign trainer to member (Admin/Staff only)
router.put(
  '/:id/assign-trainer',
  authorize('ADMIN', 'STAFF'),
  idValidation,
  assignTrainerValidation,
  validateRequest,
  assignTrainer
);

// DELETE /api/members/:id/trainer - Remove trainer from member (Admin/Staff only)
router.delete(
  '/:id/trainer',
  authorize('ADMIN', 'STAFF'),
  idValidation,
  validateRequest,
  removeTrainer
);

// Route documentation
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Member API endpoints',
    endpoints: {
      'GET /': 'Get all members with pagination and filtering (Admin/Staff)',
      'GET /statistics': 'Get member statistics (Admin/Staff)',
      'GET /me': 'Get current member profile (Member)',
      'GET /trainer/:trainerId': 'Get members by trainer (Admin/Staff/Trainer)',
      'GET /code/:memberCode': 'Get member by member code (Admin/Staff/Trainer)',
      'GET /:id': 'Get member by ID (Admin/Staff/Trainer/Self)',
      'POST /': 'Create new member (Admin/Staff)',
      'PUT /:id': 'Update member (Admin/Staff)',
      'DELETE /:id': 'Delete member (Admin)',
      'PUT /:id/assign-trainer': 'Assign trainer to member (Admin/Staff)',
      'DELETE /:id/trainer': 'Remove trainer from member (Admin/Staff)'
    },
    queryParameters: {
      page: 'Page number (default: 1)',
      limit: 'Items per page (default: 10, max: 100)',
      search: 'Search by name, email, username, or member code',
      status: 'Filter by membership status (ACTIVE/EXPIRED/SUSPENDED/CANCELLED)',
      trainerId: 'Filter by assigned trainer',
      sortBy: 'Sort by field (joinDate/memberCode/membershipStatus/createdAt)',
      sortOrder: 'Sort order (asc/desc)'
    },
    permissions: {
      ADMIN: 'Full access to all member operations',
      STAFF: 'Read/Write access, cannot delete members',
      TRAINER: 'Read access to assigned members only',
      MEMBER: 'Read access to own profile only'
    }
  });
});

export default router;