"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
const error_middleware_1 = require("@/middlewares/error.middleware");
const User_model_1 = require("@/models/User.model");
const UserProfile_model_1 = require("@/models/UserProfile.model");
const Role_model_1 = require("@/models/Role.model");
const password_1 = require("@/utils/password");
const error_middleware_2 = require("@/middlewares/error.middleware");
const router = (0, express_1.Router)();
// Authentication required for all routes
router.use(auth_middleware_1.authenticate);
// Get all users (Admin only)
const getUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};
    if (status) {
        whereClause.status = status;
    }
    if (search) {
        const { Op } = require('sequelize');
        const searchTerm = `%${search}%`;
        whereClause[Op.or] = [
            { email: { [Op.like]: searchTerm } },
            { username: { [Op.like]: searchTerm } }
        ];
    }
    const includeClause = [
        {
            association: 'role',
            attributes: ['id', 'name', 'description']
        },
        {
            association: 'profile',
            attributes: ['id', 'fullName', 'avatarUrl']
        }
    ];
    if (role) {
        includeClause[0].where = { name: role };
    }
    const { rows: users, count } = await User_model_1.User.findAndCountAll({
        where: whereClause,
        include: includeClause,
        attributes: { exclude: ['passwordHash'] },
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset,
        distinct: true
    });
    const totalPages = Math.ceil(count / parseInt(limit));
    res.json({
        success: true,
        data: {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages
            }
        }
    });
});
// Get user by ID (Admin only)
const getUserById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await User_model_1.User.findByPk(parseInt(id), {
        attributes: { exclude: ['passwordHash'] },
        include: [
            {
                association: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                association: 'profile',
                attributes: { exclude: [] }
            }
        ]
    });
    if (!user) {
        throw error_middleware_2.createError.notFound('User not found');
    }
    res.json({
        success: true,
        data: { user }
    });
});
// Update user status (Admin only)
const updateUserStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User_model_1.User.findByPk(parseInt(id));
    if (!user) {
        throw error_middleware_2.createError.notFound('User not found');
    }
    await user.update({ status });
    const updatedUser = await User_model_1.User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash'] },
        include: [
            {
                association: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                association: 'profile',
                attributes: ['id', 'fullName', 'avatarUrl']
            }
        ]
    });
    res.json({
        success: true,
        message: 'User status updated successfully',
        data: { user: updatedUser }
    });
});
// Get user statistics (Admin only)
const getUserStatistics = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const [totalUsers, activeUsers, inactiveUsers, lockedUsers, adminCount, staffCount, trainerCount, memberCount] = await Promise.all([
        User_model_1.User.count(),
        User_model_1.User.countByStatus('ACTIVE'),
        User_model_1.User.countByStatus('INACTIVE'),
        User_model_1.User.countByStatus('LOCKED'),
        User_model_1.User.countByRole('ADMIN'),
        User_model_1.User.countByRole('STAFF'),
        User_model_1.User.countByRole('TRAINER'),
        User_model_1.User.countByRole('MEMBER')
    ]);
    res.json({
        success: true,
        data: {
            statistics: {
                total: totalUsers,
                byStatus: {
                    active: activeUsers,
                    inactive: inactiveUsers,
                    locked: lockedUsers
                },
                byRole: {
                    admin: adminCount,
                    staff: staffCount,
                    trainer: trainerCount,
                    member: memberCount
                }
            }
        }
    });
});
// Create staff member (Admin only)
const createStaff = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { username, email, password, fullName, phone, dateOfBirth, gender = 'OTHER' } = req.body;
    const { Op } = require('sequelize');
    const existingUser = await User_model_1.User.findOne({
        where: {
            [Op.or]: [{ email }, { username }]
        }
    });
    if (existingUser) {
        throw error_middleware_2.createError.conflict('User with this email or username already exists');
    }
    const staffRole = await Role_model_1.Role.findByName('STAFF');
    if (!staffRole) {
        throw error_middleware_2.createError.internal('Staff role not found');
    }
    const passwordHash = await (0, password_1.hashPassword)(password);
    const user = await User_model_1.User.create({
        roleId: staffRole.id,
        username,
        email,
        passwordHash,
        phone,
        status: 'ACTIVE'
    });
    await UserProfile_model_1.UserProfile.create({
        userId: user.id,
        fullName,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
    });
    res.status(201).json({
        success: true,
        message: 'Staff created successfully',
        data: { user: { id: user.id, username, email } }
    });
});
// Validation
const queryValidation = [
    (0, express_validator_1.query)('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('search').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.query)('role').optional({ checkFalsy: true }).isIn(['ADMIN', 'STAFF', 'TRAINER', 'MEMBER']),
    (0, express_validator_1.query)('status').optional({ checkFalsy: true }).isIn(['ACTIVE', 'INACTIVE', 'LOCKED']),
    (0, express_validator_1.query)('sortBy').optional({ checkFalsy: true }).isIn(['createdAt', 'email', 'username']),
    (0, express_validator_1.query)('sortOrder').optional({ checkFalsy: true }).isIn(['asc', 'desc'])
];
const idValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 })
];
const statusValidation = [
    (0, express_validator_1.body)('status').isIn(['ACTIVE', 'INACTIVE', 'LOCKED'])
];
const createStaffValidation = [
    (0, express_validator_1.body)('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().normalizeEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name is required')
];
// Routes
router.get('/', (0, auth_middleware_1.authorize)('ADMIN'), queryValidation, validation_middleware_1.validateRequest, getUsers);
router.post('/staff', (0, auth_middleware_1.authorize)('ADMIN'), createStaffValidation, validation_middleware_1.validateRequest, createStaff);
router.get('/statistics', (0, auth_middleware_1.authorize)('ADMIN'), getUserStatistics);
router.get('/:id', (0, auth_middleware_1.authorize)('ADMIN'), idValidation, validation_middleware_1.validateRequest, getUserById);
router.put('/:id/status', (0, auth_middleware_1.authorize)('ADMIN'), idValidation, statusValidation, validation_middleware_1.validateRequest, updateUserStatus);
exports.default = router;
//# sourceMappingURL=user.routes.js.map