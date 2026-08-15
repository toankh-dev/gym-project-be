"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const member_controller_1 = require("@/controllers/member.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
const router = (0, express_1.Router)();
// Authentication required for all routes
router.use(auth_middleware_1.authenticate);
// Validation rules
const memberValidation = [
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
    (0, express_validator_1.body)('joinDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid join date'),
    (0, express_validator_1.body)('assignedTrainerId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Assigned trainer ID must be a positive integer'),
    (0, express_validator_1.body)('heightCm')
        .optional()
        .isFloat({ min: 50, max: 300 })
        .withMessage('Height must be between 50 and 300 cm'),
    (0, express_validator_1.body)('weightKg')
        .optional()
        .isFloat({ min: 20, max: 500 })
        .withMessage('Weight must be between 20 and 500 kg'),
    (0, express_validator_1.body)('trainingLevel')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
        .withMessage('Training level must be BEGINNER, INTERMEDIATE, or ADVANCED'),
    (0, express_validator_1.body)('membershipStatus')
        .optional()
        .isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'])
        .withMessage('Membership status must be ACTIVE, EXPIRED, SUSPENDED, or CANCELLED')
];
const updateMemberValidation = [
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
    (0, express_validator_1.body)('membershipStatus')
        .optional()
        .isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'])
        .withMessage('Membership status must be ACTIVE, EXPIRED, SUSPENDED, or CANCELLED'),
    (0, express_validator_1.body)('assignedTrainerId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Assigned trainer ID must be a positive integer'),
    (0, express_validator_1.body)('heightCm')
        .optional()
        .isFloat({ min: 50, max: 300 })
        .withMessage('Height must be between 50 and 300 cm'),
    (0, express_validator_1.body)('weightKg')
        .optional()
        .isFloat({ min: 20, max: 500 })
        .withMessage('Weight must be between 20 and 500 kg'),
    (0, express_validator_1.body)('trainingLevel')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
        .withMessage('Training level must be BEGINNER, INTERMEDIATE, or ADVANCED')
];
const idValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer')
];
const memberCodeValidation = [
    (0, express_validator_1.param)('memberCode')
        .matches(/^M\d{6}$/)
        .withMessage('Member code must be in format M######')
];
const trainerIdValidation = [
    (0, express_validator_1.param)('trainerId')
        .isInt({ min: 1 })
        .withMessage('Trainer ID must be a positive integer')
];
const assignTrainerValidation = [
    (0, express_validator_1.body)('trainerId')
        .isInt({ min: 1 })
        .withMessage('Trainer ID must be a positive integer')
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
        .isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'])
        .withMessage('Status must be ACTIVE, EXPIRED, SUSPENDED, or CANCELLED'),
    (0, express_validator_1.query)('trainerId')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('Trainer ID must be a positive integer'),
    (0, express_validator_1.query)('sortBy')
        .optional({ checkFalsy: true })
        .isIn(['joinDate', 'memberCode', 'membershipStatus', 'createdAt'])
        .withMessage('Sort by must be joinDate, memberCode, membershipStatus, or createdAt'),
    (0, express_validator_1.query)('sortOrder')
        .optional({ checkFalsy: true })
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
];
// Routes
// GET /api/members - Get all members (Admin/Staff only)
router.get('/', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), queryValidation, validation_middleware_1.validateRequest, member_controller_1.getMembers);
// GET /api/members/statistics - Get member statistics (Admin/Staff only)
router.get('/statistics', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), member_controller_1.getMemberStatistics);
// GET /api/members/me - Get current member's profile (Member only)
router.get('/me', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.getCurrentMember);
// Preferences validation
const preferencesValidation = [
    (0, express_validator_1.body)('notifyEmail').optional().isBoolean().withMessage('notifyEmail must be a boolean'),
    (0, express_validator_1.body)('notifySms').optional().isBoolean().withMessage('notifySms must be a boolean'),
    (0, express_validator_1.body)('notifyPush').optional().isBoolean().withMessage('notifyPush must be a boolean'),
    (0, express_validator_1.body)('notifyWorkoutReminders').optional().isBoolean().withMessage('notifyWorkoutReminders must be a boolean'),
    (0, express_validator_1.body)('notifySubscriptionExpiry').optional().isBoolean().withMessage('notifySubscriptionExpiry must be a boolean'),
    (0, express_validator_1.body)('notifyTrainerMessages').optional().isBoolean().withMessage('notifyTrainerMessages must be a boolean'),
    (0, express_validator_1.body)('profileVisibility')
        .optional()
        .isIn(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'])
        .withMessage('profileVisibility must be PUBLIC, MEMBERS_ONLY, or PRIVATE'),
    (0, express_validator_1.body)('showProgress').optional().isBoolean().withMessage('showProgress must be a boolean'),
    (0, express_validator_1.body)('showStats').optional().isBoolean().withMessage('showStats must be a boolean')
];
// GET /api/members/me/preferences - Get current member's preferences (Member only)
router.get('/me/preferences', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.getMyPreferences);
// PUT /api/members/me/preferences - Update current member's preferences (Member only)
router.put('/me/preferences', (0, auth_middleware_1.authorize)('MEMBER'), preferencesValidation, validation_middleware_1.validateRequest, member_controller_1.updateMyPreferences);
// GET /api/members/me/dashboard - aggregated dashboard for current member
router.get('/me/dashboard', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.getMyDashboard);
// GET /api/members/me/schedules - paginated schedule_members rows
router.get('/me/schedules', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.getMySchedules);
// GET /api/members/me/attendance - attendance logs + daily series + stats
router.get('/me/attendance', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.getMyAttendance);
// GET /api/members/me/payments - payment history
router.get('/me/payments', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.getMyPayments);
// POST /api/members/me/schedules/:scheduleId/book - book a future schedule
router.post('/me/schedules/:scheduleId/book', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.bookMySchedule);
// DELETE /api/members/me/schedules/:scheduleId/booking - cancel a booking
router.delete('/me/schedules/:scheduleId/booking', (0, auth_middleware_1.authorize)('MEMBER'), member_controller_1.cancelMyBooking);
// GET /api/members/trainer/:trainerId - Get members by trainer (Admin/Staff/Trainer for own)
router.get('/trainer/:trainerId', trainerIdValidation, queryValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), member_controller_1.getMembersByTrainer);
// GET /api/members/code/:memberCode - Get member by member code
router.get('/code/:memberCode', memberCodeValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), member_controller_1.getMemberByCode);
// GET /api/members/:id - Get member by ID
router.get('/:id', idValidation, validation_middleware_1.validateRequest, (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), (0, auth_middleware_1.selfOrAdmin)((req) => {
    // For members, they can only access their own data
    if (req.user?.role.name === 'MEMBER') {
        // Find member by user_id and compare with requested id
        return parseInt(req.params.id); // This would need additional logic
    }
    return parseInt(req.params.id);
}), member_controller_1.getMemberById);
// POST /api/members - Create new member (Admin/Staff only)
router.post('/', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), memberValidation, validation_middleware_1.validateRequest, member_controller_1.createMember);
// PUT /api/members/:id - Update member (Admin/Staff only)
router.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), idValidation, updateMemberValidation, validation_middleware_1.validateRequest, member_controller_1.updateMember);
// DELETE /api/members/:id - Delete member (Admin only)
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), idValidation, validation_middleware_1.validateRequest, member_controller_1.deleteMember);
// PUT /api/members/:id/assign-trainer - Assign trainer to member (Admin/Staff only)
router.put('/:id/assign-trainer', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), idValidation, assignTrainerValidation, validation_middleware_1.validateRequest, member_controller_1.assignTrainer);
// DELETE /api/members/:id/trainer - Remove trainer from member (Admin/Staff only)
router.delete('/:id/trainer', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), idValidation, validation_middleware_1.validateRequest, member_controller_1.removeTrainer);
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
exports.default = router;
//# sourceMappingURL=member.routes.js.map