"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const trainer_controller_1 = require("@/controllers/trainer.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.get('/active', auth_middleware_1.optionalAuthenticate, trainer_controller_1.getActiveTrainers);
router.get('/specializations', trainer_controller_1.getSpecializations);
// Authentication required for all other routes
router.use(auth_middleware_1.authenticate);
// Validation rules
const trainerValidation = [
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
    (0, express_validator_1.body)('fullName')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Full name must be between 2 and 150 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['MALE', 'FEMALE', 'OTHER'])
        .withMessage('Gender must be MALE, FEMALE, or OTHER'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    (0, express_validator_1.body)('experienceYears')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience years must be between 0 and 50'),
    (0, express_validator_1.body)('specializationIds')
        .optional()
        .isArray()
        .withMessage('Specialization IDs must be an array'),
    (0, express_validator_1.body)('specializationIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Each specialization ID must be a positive integer'),
    (0, express_validator_1.body)('facebookUrl')
        .optional()
        .isURL()
        .withMessage('Facebook URL must be a valid URL'),
    (0, express_validator_1.body)('instagramUrl')
        .optional()
        .isURL()
        .withMessage('Instagram URL must be a valid URL')
];
const updateTrainerValidation = [
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE', 'LOCKED'])
        .withMessage('Status must be ACTIVE, INACTIVE, or LOCKED'),
    (0, express_validator_1.body)('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Full name must be between 2 and 150 characters'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['MALE', 'FEMALE', 'OTHER'])
        .withMessage('Gender must be MALE, FEMALE, or OTHER'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    (0, express_validator_1.body)('experienceYears')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience years must be between 0 and 50'),
    (0, express_validator_1.body)('trainerStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Trainer status must be ACTIVE or INACTIVE'),
    (0, express_validator_1.body)('specializationIds')
        .optional()
        .isArray()
        .withMessage('Specialization IDs must be an array'),
    (0, express_validator_1.body)('specializationIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Each specialization ID must be a positive integer'),
    (0, express_validator_1.body)('facebookUrl')
        .optional()
        .isURL()
        .withMessage('Facebook URL must be a valid URL'),
    (0, express_validator_1.body)('instagramUrl')
        .optional()
        .isURL()
        .withMessage('Instagram URL must be a valid URL')
];
const idValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer')
];
const trainerCodeValidation = [
    (0, express_validator_1.param)('trainerCode')
        .matches(/^T\d{6}$/)
        .withMessage('Trainer code must be in format T######')
];
const specializationValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Specialization name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters')
];
const updateSpecializationValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Specialization name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Status must be ACTIVE or INACTIVE')
];
const queryValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('status')
        .optional({ checkFalsy: true })
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Status must be ACTIVE or INACTIVE'),
    (0, express_validator_1.query)('specialization')
        .optional({ checkFalsy: true })
        .trim(),
    (0, express_validator_1.query)('specializationId')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('Specialization ID must be a positive integer'),
    (0, express_validator_1.query)('sortBy')
        .optional({ checkFalsy: true })
        .isIn(['ratingAvg', 'experienceYears', 'trainerCode', 'createdAt'])
        .withMessage('Sort by must be ratingAvg, experienceYears, trainerCode, or createdAt'),
    (0, express_validator_1.query)('sortOrder')
        .optional({ checkFalsy: true })
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
];
// Routes
// GET /api/trainers - Get all trainers (Admin/Staff only)
router.get('/', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), queryValidation, validation_middleware_1.validateRequest, trainer_controller_1.getTrainers);
// GET /api/trainers/statistics - Get trainer statistics (Admin/Staff only)
router.get('/statistics', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), trainer_controller_1.getTrainerStatistics);
// GET /api/trainers/me/dashboard - aggregated dashboard data for the current trainer
router.get('/me/dashboard', (0, auth_middleware_1.authorize)('TRAINER'), trainer_controller_1.getMyDashboard);
// GET /api/trainers/me/members - paginated assigned members for the current trainer
router.get('/me/members', (0, auth_middleware_1.authorize)('TRAINER'), trainer_controller_1.getMyMembers);
// GET /api/trainers/me/member-sessions - paginated schedule_members rows for the current trainer's schedules
router.get('/me/member-sessions', (0, auth_middleware_1.authorize)('TRAINER'), trainer_controller_1.getMyMemberSessions);
// GET /api/trainers/me - Get current trainer's profile (Trainer only)
router.get('/me', (0, auth_middleware_1.authorize)('TRAINER'), trainer_controller_1.getCurrentTrainer);
// GET /api/trainers/code/:trainerCode - Get trainer by trainer code
router.get('/code/:trainerCode', trainerCodeValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), trainer_controller_1.getTrainerByCode);
// GET /api/trainers/:id - Get trainer by ID
router.get('/:id', idValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), (0, auth_middleware_1.selfOrAdmin)((req) => {
    // For trainers, they can only access their own data
    if (req.user?.role.name === 'TRAINER') {
        return parseInt(req.params.id);
    }
    return parseInt(req.params.id);
}), trainer_controller_1.getTrainerById);
// GET /api/trainers/:id/members - Get trainer's assigned members
router.get('/:id/members', idValidation, queryValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), (0, auth_middleware_1.selfOrAdmin)((req) => parseInt(req.params.id)), trainer_controller_1.getTrainerMembers);
// POST /api/trainers - Create new trainer (Admin only)
router.post('/', (0, auth_middleware_1.authorize)('ADMIN'), trainerValidation, validation_middleware_1.validateRequest, trainer_controller_1.createTrainer);
// PUT /api/trainers/:id - Update trainer (Admin/Self for trainers)
router.put('/:id', idValidation, updateTrainerValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'TRAINER'), (0, auth_middleware_1.selfOrAdmin)((req) => {
    // Trainers can update their own profile
    if (req.user?.role.name === 'TRAINER') {
        return parseInt(req.params.id);
    }
    return parseInt(req.params.id);
}), trainer_controller_1.updateTrainer);
// DELETE /api/trainers/:id - Delete trainer (Admin only)
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), idValidation, validation_middleware_1.validateRequest, trainer_controller_1.deleteTrainer);
// Specialization routes
// POST /api/trainers/specializations - Create specialization (Admin only)
router.post('/specializations', (0, auth_middleware_1.authorize)('ADMIN'), specializationValidation, validation_middleware_1.validateRequest, trainer_controller_1.createSpecialization);
// PUT /api/trainers/specializations/:id - Update specialization (Admin only)
router.put('/specializations/:id', (0, auth_middleware_1.authorize)('ADMIN'), idValidation, updateSpecializationValidation, validation_middleware_1.validateRequest, trainer_controller_1.updateSpecialization);
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
exports.default = router;
//# sourceMappingURL=trainer.routes.js.map