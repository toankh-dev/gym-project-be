import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validateRequest } from '@/middlewares/validation.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';
import { User } from '@/models/User.model';
import { UserProfile } from '@/models/UserProfile.model';
import { Role } from '@/models/Role.model';
import { hashPassword } from '@/utils/password';
import { createError } from '@/middlewares/error.middleware';

const router = Router();

// Authentication required for all routes
router.use(authenticate);

// Get all users (Admin only)
const getUsers = asyncHandler(async (req: any, res: any): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const whereClause: any = {};

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

  const includeClause: any[] = [
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

  const { rows: users, count } = await User.findAndCountAll({
    where: whereClause,
    include: includeClause,
    attributes: { exclude: ['passwordHash'] },
    order: [[User, sortBy, sortOrder]],
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
const getUserById = asyncHandler(async (req: any, res: any): Promise<void> => {
  const { id } = req.params;

  const user = await User.findByPk(parseInt(id), {
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
    throw createError.notFound('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
});

// Update user status (Admin only)
const updateUserStatus = asyncHandler(async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findByPk(parseInt(id));

  if (!user) {
    throw createError.notFound('User not found');
  }

  await user.update({ status });

  const updatedUser = await User.findByPk(user.id, {
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
const getUserStatistics = asyncHandler(async (req: any, res: any): Promise<void> => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    lockedUsers,
    adminCount,
    staffCount,
    trainerCount,
    memberCount
  ] = await Promise.all([
    User.count(),
    User.countByStatus('ACTIVE'),
    User.countByStatus('INACTIVE'),
    User.countByStatus('LOCKED'),
    User.countByRole('ADMIN'),
    User.countByRole('STAFF'),
    User.countByRole('TRAINER'),
    User.countByRole('MEMBER')
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
const createStaff = asyncHandler(async (req: any, res: any): Promise<void> => {
  const {
    username,
    email,
    password,
    fullName,
    phone,
    dateOfBirth,
    gender = 'OTHER'
  } = req.body;

  const { Op } = require('sequelize');
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    } as any
  });

  if (existingUser) {
    throw createError.conflict('User with this email or username already exists');
  }

  const staffRole = await Role.findByName('STAFF');
  if (!staffRole) {
    throw createError.internal('Staff role not found');
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    roleId: staffRole.id,
    username,
    email,
    passwordHash,
    phone,
    status: 'ACTIVE'
  });

  await UserProfile.create({
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
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('search').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }),
  query('role').optional({ checkFalsy: true }).isIn(['ADMIN', 'STAFF', 'TRAINER', 'MEMBER']),
  query('status').optional({ checkFalsy: true }).isIn(['ACTIVE', 'INACTIVE', 'LOCKED']),
  query('sortBy').optional({ checkFalsy: true }).isIn(['createdAt', 'email', 'username']),
  query('sortOrder').optional({ checkFalsy: true }).isIn(['asc', 'desc'])
];

const idValidation = [
  param('id').isInt({ min: 1 })
];

const statusValidation = [
  body('status').isIn(['ACTIVE', 'INACTIVE', 'LOCKED'])
];

const createStaffValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name is required')
];

// Routes
router.get(
  '/',
  authorize('ADMIN'),
  queryValidation,
  validateRequest,
  getUsers
);

router.post(
  '/staff',
  authorize('ADMIN'),
  createStaffValidation,
  validateRequest,
  createStaff
);

router.get(
  '/statistics',
  authorize('ADMIN'),
  getUserStatistics
);

router.get(
  '/:id',
  authorize('ADMIN'),
  idValidation,
  validateRequest,
  getUserById
);

router.put(
  '/:id/status',
  authorize('ADMIN'),
  idValidation,
  statusValidation,
  validateRequest,
  updateUserStatus
);

export default router;