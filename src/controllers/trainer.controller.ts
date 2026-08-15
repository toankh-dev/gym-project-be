import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '@/config/database.config';
import { Trainer, TrainerProfile, Specialization } from '@/models/Trainer.model';
import { User } from '@/models/User.model';
import { UserProfile } from '@/models/UserProfile.model';
import { Role } from '@/models/Role.model';
import { Member } from '@/models/Member.model';
import { TrainingSchedule } from '@/models/Schedule.model';
import { hashPassword } from '@/utils/password';
import { createError, asyncHandler } from '@/middlewares/error.middleware';
import { loggers } from '@/utils/logger';

// Get all trainers with pagination and filtering
export const getTrainers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    specializationId,
    sortBy = 'ratingAvg',
    sortOrder = 'desc'
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const whereClause: any = {};
  const userWhereClause: any = {};

  // Filter by trainer status
  if (status) {
    whereClause.status = status;
  }

  // Search functionality
  if (search) {
    const searchTerm = `%${search}%`;
    userWhereClause[Op.or] = [
      { email: { [Op.like]: searchTerm } },
      { username: { [Op.like]: searchTerm } },
      { '$user.profile.fullName$': { [Op.like]: searchTerm } },
      { trainerCode: { [Op.like]: searchTerm } }
    ];
  }

  const includeClause: any[] = [
    {
      association: 'user',
      attributes: { exclude: ['passwordHash'] },
      where: userWhereClause,
      include: [
        {
          association: 'profile',
          attributes: ['id', 'fullName', 'gender', 'dateOfBirth', 'avatarUrl', 'address']
        },
        {
          association: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    },
    {
      association: 'profile',
      attributes: { exclude: [] }
    },
    {
      association: 'specializations',
      where: { status: 'ACTIVE' },
      required: false
    }
  ];

  // Filter by specialization if provided
  if (specializationId) {
    includeClause[2].where = {
      ...includeClause[2].where,
      id: specializationId
    };
    includeClause[2].required = true;
  }

  const { rows: trainers, count } = await Trainer.findAndCountAll({
    where: whereClause,
    include: includeClause,
    order: [[sortBy as string, sortOrder as string]],
    limit: parseInt(limit as string),
    offset,
    distinct: true
  });

  const totalPages = Math.ceil(count / parseInt(limit as string));

  res.json({
    success: true,
    data: {
      trainers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        totalPages
      }
    }
  });
});

// Get active trainers (public endpoint)
export const getActiveTrainers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { specializationId } = req.query;

  let trainers;
  if (specializationId) {
    trainers = await Trainer.findBySpecialization(parseInt(specializationId as string));
  } else {
    trainers = await Trainer.findActiveTrainers();
  }

  res.json({
    success: true,
    data: { trainers }
  });
});

// Get trainer by ID
export const getTrainerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const trainer = await Trainer.findWithFullDetails(parseInt(id));

  if (!trainer) {
    throw createError.notFound('Trainer not found');
  }

  res.json({
    success: true,
    data: { trainer }
  });
});

// Get trainer by trainer code
export const getTrainerByCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { trainerCode } = req.params;

  const trainer = await Trainer.findByTrainerCode(trainerCode);

  if (!trainer) {
    throw createError.notFound('Trainer not found');
  }

  res.json({
    success: true,
    data: { trainer }
  });
});

// Create new trainer
export const createTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    // User data
    username,
    email,
    password,
    phone,
    // User profile data
    fullName,
    gender = 'OTHER',
    dateOfBirth,
    address,
    bio,
    // Trainer data
    experienceYears = 0,
    // Trainer profile data
    certificate,
    certificatesDetail,
    education,
    skills,
    workExperience,
    introduction,
    trainingPhilosophy,
    achievements,
    availableTime,
    facebookUrl,
    instagramUrl,
    // Specializations
    specializationIds = []
  } = req.body;

  // Check if user with email or username already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });

  if (existingUser) {
    throw createError.conflict('User with this email or username already exists');
  }

  // Verify specializations exist if provided
  if (specializationIds.length > 0) {
    const validSpecializations = await Specialization.findAll({
      where: {
        id: specializationIds,
        status: 'ACTIVE'
      }
    });

    if (validSpecializations.length !== specializationIds.length) {
      throw createError.validation('Some specializations are invalid or inactive');
    }
  }

  const transaction = await sequelize.transaction();
  try {
    // Get trainer role
    const trainerRole = await Role.findByName('TRAINER');
    if (!trainerRole) {
      throw createError.internal('Trainer role not found');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate trainer code
    const trainerCode = await Trainer.generateTrainerCode();

    // Create user
    const user = await User.create({
      roleId: trainerRole.id,
      username,
      email,
      passwordHash,
      phone,
      status: 'ACTIVE'
    }, { transaction });

    // Create user profile
    await UserProfile.create({
      userId: user.id,
      fullName,
      gender: (gender && ['MALE', 'FEMALE', 'OTHER'].includes(String(gender).toUpperCase()))
        ? (String(gender).toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER')
        : 'OTHER',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address: address || undefined,
      bio: bio || undefined
    }, { transaction });

    // Create trainer
    const trainer = await Trainer.create({
      userId: user.id,
      trainerCode,
      experienceYears: !isNaN(parseInt(experienceYears)) ? parseInt(experienceYears) : 0,
      ratingAvg: 0, // Initial rating
      status: 'ACTIVE'
    }, { transaction });

    // Create trainer profile
    await TrainerProfile.create({
      trainerId: trainer.id,
      certificate: certificate || undefined,
      certificatesDetail: certificatesDetail || undefined,
      education: education || undefined,
      skills: skills || undefined,
      workExperience: workExperience || undefined,
      introduction: introduction || undefined,
      trainingPhilosophy: trainingPhilosophy || undefined,
      achievements: achievements || undefined,
      availableTime: availableTime || undefined,
      facebookUrl: facebookUrl || undefined,
      instagramUrl: instagramUrl || undefined
    }, { transaction });

    // Add specializations if provided
    if (specializationIds.length > 0) {
      const specializations = await Specialization.findAll({
        where: { id: specializationIds }
      });
      await trainer.$set('specializations', specializations, { transaction });
    }

    await transaction.commit();

    // Get the complete trainer with all associations
    const newTrainer = await Trainer.findWithFullDetails(trainer.id);

    res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      data: { trainer: newTrainer }
    });
  } catch (error: any) {
    await transaction.rollback();
    if (error.errors && Array.isArray(error.errors)) {
      const details = error.errors.map((e: any) => `${e.path || e.type}: ${e.message}`).join(', ');
      throw createError.validation(`Failed to create trainer: ${details}`, error.errors);
    }
    throw createError.internal(`Failed to create trainer: ${(error as Error).message}`);
  }
});

// Update trainer
export const updateTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    // User data
    phone,
    status,
    // User profile data
    fullName,
    gender,
    dateOfBirth,
    address,
    bio,
    // Trainer data
    experienceYears,
    trainerStatus,
    // Trainer profile data
    certificate,
    certificatesDetail,
    education,
    skills,
    workExperience,
    introduction,
    trainingPhilosophy,
    achievements,
    availableTime,
    facebookUrl,
    instagramUrl,
    // Specializations
    specializationIds
  } = req.body;

  const trainer = await Trainer.findWithFullDetails(parseInt(id));

  if (!trainer) {
    throw createError.notFound('Trainer not found');
  }

  // Verify specializations if provided
  if (specializationIds && specializationIds.length > 0) {
    const validSpecializations = await Specialization.findAll({
      where: {
        id: specializationIds,
        status: 'ACTIVE'
      }
    });

    if (validSpecializations.length !== specializationIds.length) {
      throw createError.validation('Some specializations are invalid or inactive');
    }
  }

  try {
    // Update user data
    const userUpdateData: any = {};
    if (phone !== undefined) userUpdateData.phone = phone;
    if (status !== undefined) userUpdateData.status = status;

    if (Object.keys(userUpdateData).length > 0) {
      await trainer.user.update(userUpdateData);
    }

    // Update user profile data
    const profileUpdateData: any = {};
    if (fullName !== undefined) profileUpdateData.fullName = fullName;
    if (gender !== undefined) profileUpdateData.gender = gender;
    if (dateOfBirth !== undefined) {
      profileUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (address !== undefined) profileUpdateData.address = address;
    if (bio !== undefined) profileUpdateData.bio = bio;

    if (Object.keys(profileUpdateData).length > 0) {
      await UserProfile.update(profileUpdateData, {
        where: { userId: trainer.userId }
      });
    }

    // Update trainer data
    const trainerUpdateData: any = {};
    if (experienceYears !== undefined) trainerUpdateData.experienceYears = parseInt(experienceYears);
    if (trainerStatus !== undefined) trainerUpdateData.status = trainerStatus;

    if (Object.keys(trainerUpdateData).length > 0) {
      await trainer.update(trainerUpdateData);
    }

    // Update trainer profile data
    const trainerProfileUpdateData: any = {};
    if (certificate !== undefined) trainerProfileUpdateData.certificate = certificate;
    if (certificatesDetail !== undefined) trainerProfileUpdateData.certificatesDetail = certificatesDetail;
    if (education !== undefined) trainerProfileUpdateData.education = education;
    if (skills !== undefined) trainerProfileUpdateData.skills = skills;
    if (workExperience !== undefined) trainerProfileUpdateData.workExperience = workExperience;
    if (introduction !== undefined) trainerProfileUpdateData.introduction = introduction;
    if (trainingPhilosophy !== undefined) trainerProfileUpdateData.trainingPhilosophy = trainingPhilosophy;
    if (achievements !== undefined) trainerProfileUpdateData.achievements = achievements;
    if (availableTime !== undefined) trainerProfileUpdateData.availableTime = availableTime;
    if (facebookUrl !== undefined) trainerProfileUpdateData.facebookUrl = facebookUrl;
    if (instagramUrl !== undefined) trainerProfileUpdateData.instagramUrl = instagramUrl;

    if (Object.keys(trainerProfileUpdateData).length > 0) {
      await TrainerProfile.update(trainerProfileUpdateData, {
        where: { trainerId: trainer.id }
      });
    }

    // Update specializations if provided
    if (specializationIds !== undefined) {
      if (specializationIds.length > 0) {
        const specializations = await Specialization.findAll({
          where: { id: specializationIds }
        });
        await trainer.$set('specializations', specializations);
      } else {
        await trainer.$set('specializations', []);
      }
    }

    // Get updated trainer
    const updatedTrainer = await Trainer.findWithFullDetails(trainer.id);

    res.json({
      success: true,
      message: 'Trainer updated successfully',
      data: { trainer: updatedTrainer }
    });
  } catch (error) {
    throw createError.internal(`Failed to update trainer: ${(error as Error).message}`);
  }
});

// Delete trainer (soft delete)
export const deleteTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const trainer = await Trainer.findByPk(parseInt(id), {
    include: [
      {
        association: 'assignedMembers',
        where: { membershipStatus: 'ACTIVE' },
        required: false
      }
    ]
  });

  if (!trainer) {
    throw createError.notFound('Trainer not found');
  }

  // Check if trainer has active members assigned
  if (trainer.assignedMembers && trainer.assignedMembers.length > 0) {
    throw createError.conflict('Cannot delete trainer with active assigned members. Please reassign members first.');
  }

  // Soft delete the trainer
  await trainer.destroy();

  res.json({
    success: true,
    message: 'Trainer deleted successfully'
  });
});

// Get trainer statistics
export const getTrainerStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await Trainer.getStatistics();

  res.json({
    success: true,
    data: { statistics: stats }
  });
});

// Get trainer's assigned members
export const getTrainerMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const trainer = await Trainer.findByPk(parseInt(id));
  if (!trainer) {
    throw createError.notFound('Trainer not found');
  }

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const whereClause: any = { assignedTrainerId: trainer.id };

  if (status) {
    whereClause.membershipStatus = status;
  }

  const { rows: members, count } = await Member.findAndCountAll({
    where: whereClause,
    include: [
      {
        association: 'user',
        attributes: { exclude: ['passwordHash'] },
        include: [
          {
            association: 'profile',
            attributes: ['id', 'fullName', 'gender', 'avatarUrl']
          }
        ]
      },
      {
        association: 'profile',
        attributes: ['id', 'fitnessGoal', 'trainingLevel', 'heightCm', 'weightKg', 'bmi']
      }
    ],
    order: [['joinDate', 'DESC']],
    limit: parseInt(limit as string),
    offset,
    distinct: true
  });

  const totalPages = Math.ceil(count / parseInt(limit as string));

  res.json({
    success: true,
    data: {
      trainer: {
        id: trainer.id,
        trainerCode: trainer.trainerCode
      },
      members,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        totalPages
      }
    }
  });
});

// Get current trainer (for trainer role accessing their own data)
export const getCurrentTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const trainer = await Trainer.findOne({
    where: { userId: user.id },
    include: [
      {
        association: 'user',
        attributes: { exclude: ['passwordHash'] },
        include: [
          {
            association: 'profile',
            attributes: { exclude: [] }
          },
          {
            association: 'role',
            attributes: ['id', 'name', 'description']
          }
        ]
      },
      {
        association: 'profile',
        attributes: { exclude: [] }
      },
      {
        association: 'specializations',
        where: { status: 'ACTIVE' },
        required: false
      }
    ]
  });

  if (!trainer) {
    throw createError.notFound('Trainer profile not found');
  }

  res.json({
    success: true,
    data: { trainer }
  });
});

// Get all specializations
export const getSpecializations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const specializations = await Specialization.findActiveSpecializations();

  res.json({
    success: true,
    data: { specializations }
  });
});

// Create specialization (Admin only)
export const createSpecialization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;

  // Check if specialization already exists
  const existing = await Specialization.findByName(name);
  if (existing) {
    throw createError.conflict('Specialization with this name already exists');
  }

  const specialization = await Specialization.create({
    name,
    description,
    status: 'ACTIVE'
  });

  res.status(201).json({
    success: true,
    message: 'Specialization created successfully',
    data: { specialization }
  });
});

// Update specialization (Admin only)
export const updateSpecialization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const specialization = await Specialization.findByPk(parseInt(id));
  if (!specialization) {
    throw createError.notFound('Specialization not found');
  }

  // Check for name conflicts if name is being changed
  if (name && name !== specialization.name) {
    const existing = await Specialization.findByName(name);
    if (existing) {
      throw createError.conflict('Specialization with this name already exists');
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  await specialization.update(updateData);

  res.json({
    success: true,
    message: 'Specialization updated successfully',
    data: { specialization }
  });
});

export const getMyMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const trainer: any = await Trainer.findOne({ where: { userId: user.id }, raw: true });
  if (!trainer) throw createError.forbidden('No trainer profile for this user');

  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

  const count = await Member.count({ where: { assignedTrainerId: trainer.id } });
  const members: any[] = await Member.findAll({
    where: { assignedTrainerId: trainer.id } as any,
    include: [
      { association: 'user', attributes: ['id', 'email'], include: [{ association: 'profile', attributes: ['fullName', 'avatarUrl'] }] },
    ],
    limit: parseInt(String(limit), 10),
    offset,
    order: [['created_at', 'DESC']] as any,
    raw: true,
    nest: true,
  });

  res.json({
    success: true,
    data: {
      members,
      pagination: {
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        total: count,
        totalPages: Math.ceil(count / parseInt(String(limit), 10)),
      },
    },
  });
});

export const getMyMemberSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const trainer: any = await Trainer.findOne({ where: { userId: user.id }, raw: true });
  if (!trainer) throw createError.forbidden('No trainer profile for this user');

  const { status, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

  const sequelize = require('@/config/database.config').default;
  const where: any = `WHERE ts.trainer_id = ${trainer.id}`;
  const conds: string[] = [];
  if (status) conds.push(`sm.attendance_status = '${String(status).replace(/'/g, "''")}'`);
  const whereSql = conds.length > 0 ? `${where} AND ${conds.join(' AND ')}` : where;

  const [countRows]: any = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     ${whereSql}`,
  );
  const total = Number(countRows[0]?.cnt || 0);

  const [rows]: any = await sequelize.query(
    `SELECT
       sm.id AS id,
       sm.attendance_status AS attendanceStatus,
       sm.payment_status AS paymentStatus,
       sm.enrollment_date AS enrollmentDate,
       sm.notes AS notes,
       ts.id AS scheduleId,
       ts.class_name AS className,
       ts.class_type AS classType,
       ts.start_date AS startDate,
       ts.start_time AS startTime,
       ts.end_time AS endTime,
       ts.location AS location,
       ts.status AS scheduleStatus,
       m.id AS memberId,
       m.member_code AS memberCode,
       up.full_name AS memberName
     FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     INNER JOIN members m ON sm.member_id = m.id AND m.deleted_at IS NULL
     INNER JOIN users u ON m.user_id = u.id AND u.deleted_at IS NULL
     LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
     ${whereSql}
     ORDER BY ts.start_date DESC, ts.start_time DESC
     LIMIT ${parseInt(String(limit), 10)} OFFSET ${offset}`,
  );

  const sessions = rows.map((r: any) => ({
    id: r.id,
    attendanceStatus: r.attendanceStatus,
    paymentStatus: r.paymentStatus,
    enrollmentDate: r.enrollmentDate,
    notes: r.notes,
    schedule: {
      id: r.scheduleId,
      className: r.className,
      classType: r.classType,
      startDate: r.startDate,
      startTime: r.startTime,
      endTime: r.endTime,
      location: r.location,
      status: r.scheduleStatus,
    },
    member: {
      id: r.memberId,
      memberCode: r.memberCode,
      fullName: r.memberName || 'Unknown',
    },
  }));

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit), 10)),
      },
    },
  });
});

export const getMyDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const trainer: any = await Trainer.findOne({ where: { userId: user.id }, raw: true });
  if (!trainer) throw createError.forbidden('No trainer profile for this user');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    totalMembers, activeMembers, sessionsToday, sessionsThisWeek,
    monthlyIncome, completedCount, cancelledCount,
  ] = await Promise.all([
    Member.count({ where: { assignedTrainerId: trainer.id } }),
    Member.count({ where: { assignedTrainerId: trainer.id, membershipStatus: 'ACTIVE' } }),
    TrainingSchedule.count({ where: { trainerId: trainer.id, startDate: todayStr } }),
    TrainingSchedule.count({
      where: {
        trainerId: trainer.id,
        startDate: { [Op.gte]: startOfWeek.toISOString().split('T')[0], [Op.lt]: endOfWeek.toISOString().split('T')[0] } as any,
      } as any,
    }),
    TrainingSchedule.sum('pricePerSession', {
      where: {
        trainerId: trainer.id,
        status: 'COMPLETED',
        startDate: { [Op.gte]: startOfMonth.toISOString().split('T')[0] } as any,
      } as any,
    }),
    TrainingSchedule.count({
      where: {
        trainerId: trainer.id,
        status: 'COMPLETED',
        startDate: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] } as any,
      } as any,
    }),
    TrainingSchedule.count({
      where: {
        trainerId: trainer.id,
        status: 'CANCELLED',
        startDate: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] } as any,
      } as any,
    }),
  ]);

  const totalDecisions = completedCount + cancelledCount;
  const completionRate = totalDecisions === 0 ? 0 : Math.round((completedCount / totalDecisions) * 100);

  const todayScheduleRows: any[] = await TrainingSchedule.findAll({
    where: { trainerId: trainer.id, startDate: todayStr },
    order: [['startTime', 'ASC']],
    raw: true,
  });
  const todaySchedule = todayScheduleRows.map((s: any) => ({
    id: s.id,
    className: s.className,
    startTime: s.startTime,
    endTime: s.endTime,
    classType: s.classType,
    currentEnrollment: s.currentEnrollment,
    maxCapacity: s.maxCapacity,
    location: s.location,
  }));

  res.json({
    success: true,
    data: {
      stats: {
        totalMembers, activeMembers,
        sessionsToday, sessionsThisWeek,
        monthlyIncome: Number(monthlyIncome || 0),
        completionRate,
        avgRating: Number(trainer.ratingAvg) || 0,
      },
      todaySchedule,
    },
  });
});

export default {
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
};