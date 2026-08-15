import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getTrainers,
  getActiveTrainers,
  getTrainerById,
  getTrainerByCode,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getTrainerStatistics,
  getTrainerMembers,
  getCurrentTrainer,
  getMyDashboard,
  getMyMembers,
  getMyMemberSessions,
  getSpecializations,
  createSpecialization,
  updateSpecialization
} from '@/controllers/trainer.controller';
import { authenticate, authorize, optionalAuthenticate, selfOrAdmin } from '@/middlewares/auth.middleware';
import { validateRequest } from '@/middlewares/validation.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/active', optionalAuthenticate, getActiveTrainers);
router.get('/specializations', getSpecializations);

// Authentication required for all other routes
router.use(authenticate);

// Validation rules
const trainerValidation = [
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
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),

  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),

  body('specializationIds')
    .optional()
    .isArray()
    .withMessage('Specialization IDs must be an array'),

  body('specializationIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each specialization ID must be a positive integer'),

  body('facebookUrl')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be a valid URL'),

  body('instagramUrl')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be a valid URL')
];

const updateTrainerValidation = [
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

  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),

  body('trainerStatus')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Trainer status must be ACTIVE or INACTIVE'),

  body('specializationIds')
    .optional()
    .isArray()
    .withMessage('Specialization IDs must be an array'),

  body('specializationIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each specialization ID must be a positive integer'),

  body('facebookUrl')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be a valid URL'),

  body('instagramUrl')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be a valid URL')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const trainerCodeValidation = [
  param('trainerCode')
    .matches(/^T\d{6}$/)
    .withMessage('Trainer code must be in format T######')
];

const specializationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

const updateSpecializationValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE')
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
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE'),

  query('specialization')
    .optional({ checkFalsy: true })
    .trim(),

  query('specializationId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Specialization ID must be a positive integer'),

  query('sortBy')
    .optional({ checkFalsy: true })
    .isIn(['ratingAvg', 'experienceYears', 'trainerCode', 'createdAt'])
    .withMessage('Sort by must be ratingAvg, experienceYears, trainerCode, or createdAt'),

  query('sortOrder')
    .optional({ checkFalsy: true })
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes

// GET /api/trainers - Get all trainers (Admin/Staff only)
router.get(
  '/',
  authorize('ADMIN', 'STAFF'),
  queryValidation,
  validateRequest,
  getTrainers
);

// GET /api/trainers/statistics - Get trainer statistics (Admin/Staff only)
router.get(
  '/statistics',
  authorize('ADMIN', 'STAFF'),
  getTrainerStatistics
);

// GET /api/trainers/me/dashboard - aggregated dashboard data for the current trainer
router.get(
  '/me/dashboard',
  authorize('TRAINER'),
  getMyDashboard
);

// GET /api/trainers/me/members - paginated assigned members for the current trainer
router.get(
  '/me/members',
  authorize('TRAINER'),
  getMyMembers
);

// GET /api/trainers/me/member-sessions - paginated schedule_members rows for the current trainer's schedules
router.get(
  '/me/member-sessions',
  authorize('TRAINER'),
  getMyMemberSessions
);

// GET /api/trainers/me - Get current trainer's profile (Trainer only)
router.get(
  '/me',
  authorize('TRAINER'),
  getCurrentTrainer
);

// GET /api/trainers/code/:trainerCode - Get trainer by trainer code
router.get(
  '/code/:trainerCode',
  trainerCodeValidation,
  validateRequest,
  authorize('ADMIN', 'STAFF', 'TRAINER'),
  getTrainerByCode
);

// GET /api/trainers/:id - Get trainer by ID
router.get(
  '/:id',
  idValidation,
  validateRequest,
  authorize('ADMIN', 'STAFF', 'TRAINER'),
  selfOrAdmin((req) => {
    // For trainers, they can only access their own data
    if (req.user?.role.name === 'TRAINER') {
      return parseInt(req.params.id);
    }
    return parseInt(req.params.id);
  }),
  getTrainerById
);

// GET /api/trainers/:id/members - Get trainer's assigned members
router.get(
  '/:id/members',
  idValidation,
  queryValidation,
  validateRequest,
  authorize('ADMIN', 'STAFF', 'TRAINER'),
  selfOrAdmin((req) => parseInt(req.params.id)),
  getTrainerMembers
);

// POST /api/trainers - Create new trainer (Admin only)
router.post(
  '/',
  authorize('ADMIN'),
  trainerValidation,
  validateRequest,
  createTrainer
);

// PUT /api/trainers/:id - Update trainer (Admin/Self for trainers)
router.put(
  '/:id',
  idValidation,
  updateTrainerValidation,
  validateRequest,
  authorize('ADMIN', 'TRAINER'),
  selfOrAdmin((req) => {
    // Trainers can update their own profile
    if (req.user?.role.name === 'TRAINER') {
      return parseInt(req.params.id);
    }
    return parseInt(req.params.id);
  }),
  updateTrainer
);

// DELETE /api/trainers/:id - Delete trainer (Admin only)
router.delete(
  '/:id',
  authorize('ADMIN'),
  idValidation,
  validateRequest,
  deleteTrainer
);

// Specialization routes

// POST /api/trainers/specializations - Create specialization (Admin only)
router.post(
  '/specializations',
  authorize('ADMIN'),
  specializationValidation,
  validateRequest,
  createSpecialization
);

// PUT /api/trainers/specializations/:id - Update specialization (Admin only)
router.put(
  '/specializations/:id',
  authorize('ADMIN'),
  idValidation,
  updateSpecializationValidation,
  validateRequest,
  updateSpecialization
);

// Route documentation
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Trainer API endpoints',
    endpoints: {
      'GET /active': 'Get active trainers (Public)',
      'GET /specializations': 'Get all specializations (Public)',
      'GET /': 'Get all trainers with pagination and filtering (Admin/Staff)',
      'GET /statistics': 'Get trainer statistics (Admin/Staff)',
      'GET /me': 'Get current trainer profile (Trainer)',
      'GET /code/:trainerCode': 'Get trainer by trainer code (Admin/Staff/Trainer)',
      'GET /:id': 'Get trainer by ID (Admin/Staff/Trainer/Self)',
      'GET /:id/members': 'Get trainer\'s assigned members (Admin/Staff/Trainer/Self)',
      'POST /': 'Create new trainer (Admin)',
      'PUT /:id': 'Update trainer (Admin/Self)',
      'DELETE /:id': 'Delete trainer (Admin)',
      'POST /specializations': 'Create specialization (Admin)',
      'PUT /specializations/:id': 'Update specialization (Admin)'
    },
    queryParameters: {
      page: 'Page number (default: 1)',
      limit: 'Items per page (default: 10, max: 100)',
      search: 'Search by name, email, username, or trainer code',
      status: 'Filter by trainer status (ACTIVE/INACTIVE)',
      specializationId: 'Filter by specialization',
      sortBy: 'Sort by field (ratingAvg/experienceYears/trainerCode/createdAt)',
      sortOrder: 'Sort order (asc/desc)'
    },
    permissions: {
      ADMIN: 'Full access to all trainer operations',
      STAFF: 'Read access to trainer information',
      TRAINER: 'Read/Write access to own profile and assigned members',
      PUBLIC: 'Read access to active trainers and specializations'
    }
  });
});

export default router;