import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '@/config/database.config';
import { Member, MemberProfile, MemberPreference } from '@/models/Member.model';
import { User } from '@/models/User.model';
import { UserProfile } from '@/models/UserProfile.model';
import { Role } from '@/models/Role.model';
import { Trainer } from '@/models/Trainer.model';
import { MemberSubscription, MembershipPackage } from '@/models/Subscription.model';
import { TrainingSchedule, ScheduleMember, AttendanceLog } from '@/models/Schedule.model';
import { WorkoutProgressLog, Exercise } from '@/models/Exercise.model';
import { Payment } from '@/models/Payment.model';
import { hashPassword } from '@/utils/password';
import { createError, asyncHandler } from '@/middlewares/error.middleware';
import { loggers } from '@/utils/logger';

// Get all members with pagination and filtering
export const getMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    trainerId,
    sortBy = 'joinDate',
    sortOrder = 'desc'
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const whereClause: any = {};
  const userWhereClause: any = {};

  // Filter by membership status
  if (status) {
    whereClause.membershipStatus = status;
  }

  // Filter by assigned trainer
  if (trainerId) {
    whereClause.assignedTrainerId = trainerId;
  }

  // Search functionality
  if (search) {
    const searchTerm = `%${search}%`;
    userWhereClause[Op.or] = [
      { email: { [Op.like]: searchTerm } },
      { username: { [Op.like]: searchTerm } },
      { '$user.profile.fullName$': { [Op.like]: searchTerm } },
      { memberCode: { [Op.like]: searchTerm } }
    ];
  }

  const { rows: members, count } = await Member.findAndCountAll({
    where: whereClause,
    include: [
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
        association: 'assignedTrainer',
        attributes: ['id', 'trainerCode'],
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'email'],
            include: [
              {
                association: 'profile',
                attributes: ['id', 'fullName', 'avatarUrl']
              }
            ]
          }
        ],
        required: false
      },
      {
        association: 'currentSubscription',
        include: [
          {
            association: 'package',
            attributes: ['id', 'name', 'durationMonths', 'price']
          }
        ],
        required: false
      },
      {
        association: 'subscriptions',
        include: [
          {
            association: 'package',
            attributes: ['id', 'name', 'durationMonths', 'price']
          }
        ],
        required: false
      }
    ],
    order: [[sortBy as string, sortOrder as string]],
    limit: parseInt(limit as string),
    offset,
    distinct: true
  });

  const totalPages = Math.ceil(count / parseInt(limit as string));

  res.json({
    success: true,
    data: {
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

// Get member by ID
export const getMemberById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const member = await Member.findWithFullDetails(parseInt(id));

  if (!member) {
    throw createError.notFound('Member not found');
  }

  res.json({
    success: true,
    data: { member }
  });
});

// Get member by member code
export const getMemberByCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { memberCode } = req.params;

  const member = await Member.findByMemberCode(memberCode);

  if (!member) {
    throw createError.notFound('Member not found');
  }

  res.json({
    success: true,
    data: { member }
  });
});

// Create new member
export const createMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    // Member data
    joinDate = new Date(),
    assignedTrainerId,
    packageId,
    note,
    // Member profile data
    heightCm,
    weightKg,
    fitnessGoal,
    trainingLevel = 'BEGINNER',
    healthCondition,
    medicalNote,
    emergencyContactName,
    emergencyContactPhone
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

  // Verify assigned trainer exists if provided
  if (assignedTrainerId) {
    const trainer = await Trainer.findByPk(assignedTrainerId);
    if (!trainer || trainer.status !== 'ACTIVE') {
      throw createError.validation('Invalid or inactive trainer assigned');
    }
  }

  const transaction = await sequelize.transaction();
  try {
    // Get member role
    const memberRole = await Role.findByName('MEMBER');
    if (!memberRole) {
      throw createError.internal('Member role not found');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate member code
    const memberCode = await Member.generateMemberCode();

    // Create user
    const user = await User.create({
      roleId: memberRole.id,
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

    // Create member
    const member = await Member.create({
      userId: user.id,
      memberCode,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      membershipStatus: 'ACTIVE',
      assignedTrainerId: assignedTrainerId ? parseInt(assignedTrainerId) : undefined,
      note: note || undefined
    }, { transaction });

    // Create member profile
    const parsedHeight = (heightCm !== undefined && heightCm !== null && heightCm !== '' && !isNaN(Number(heightCm)) && Number(heightCm) > 0)
      ? parseFloat(heightCm)
      : undefined;
    const parsedWeight = (weightKg !== undefined && weightKg !== null && weightKg !== '' && !isNaN(Number(weightKg)) && Number(weightKg) > 0)
      ? parseFloat(weightKg)
      : undefined;
    const normalizedTrainingLevel = (trainingLevel && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(String(trainingLevel).toUpperCase()))
      ? (String(trainingLevel).toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')
      : 'BEGINNER';

    await MemberProfile.create({
      memberId: member.id,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      fitnessGoal: fitnessGoal || undefined,
      trainingLevel: normalizedTrainingLevel,
      healthCondition: healthCondition || undefined,
      medicalNote: medicalNote || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined
    }, { transaction });

    // Create MemberSubscription if packageId is provided (status: PENDING until paid)
    if (packageId) {
      const pkg = await MembershipPackage.findByPk(packageId);
      if (pkg && pkg.status === 'ACTIVE') {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + pkg.durationMonths);

        await MemberSubscription.create({
          memberId: member.id,
          packageId: pkg.id,
          startDate,
          endDate,
          actualPrice: pkg.price,
          status: 'PENDING',
          registeredBy: (req as any).user?.id
        }, { transaction });
      }
    }

    await transaction.commit();

    // Get the complete member with all associations
    const newMember = await Member.findWithFullDetails(member.id);

    loggers.business.memberRegistered(member.id, memberCode);

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: { member: newMember }
    });
  } catch (error: any) {
    await transaction.rollback();
    if (error.errors && Array.isArray(error.errors)) {
      const details = error.errors.map((e: any) => `${e.path || e.type}: ${e.message}`).join(', ');
      throw createError.validation(`Failed to create member: ${details}`, error.errors);
    }
    throw createError.internal(`Failed to create member: ${(error as Error).message}`);
  }
});

// Update member
export const updateMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    // Member data
    membershipStatus,
    assignedTrainerId,
    packageId,
    note,
    // Member profile data
    heightCm,
    weightKg,
    fitnessGoal,
    trainingLevel,
    healthCondition,
    medicalNote,
    emergencyContactName,
    emergencyContactPhone
  } = req.body;

  const member = await Member.findWithFullDetails(parseInt(id));

  if (!member) {
    throw createError.notFound('Member not found');
  }

  // Verify assigned trainer if provided
  if (assignedTrainerId && assignedTrainerId !== member.assignedTrainerId) {
    const trainer = await Trainer.findByPk(assignedTrainerId);
    if (!trainer || trainer.status !== 'ACTIVE') {
      throw createError.validation('Invalid or inactive trainer assigned');
    }
  }

  try {
    // Update user data
    const userUpdateData: any = {};
    if (phone !== undefined) userUpdateData.phone = phone;
    if (status !== undefined) userUpdateData.status = status;

    if (Object.keys(userUpdateData).length > 0) {
      await member.user.update(userUpdateData);
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
        where: { userId: member.userId }
      });
    }

    // Update member data
    const memberUpdateData: any = {};
    if (membershipStatus !== undefined) memberUpdateData.membershipStatus = membershipStatus;
    if (assignedTrainerId !== undefined) memberUpdateData.assignedTrainerId = assignedTrainerId;
    if (note !== undefined) memberUpdateData.note = note;

    if (Object.keys(memberUpdateData).length > 0) {
      await member.update(memberUpdateData);
    }

    // Update member profile data
    const memberProfileUpdateData: any = {};
    if (heightCm !== undefined) memberProfileUpdateData.heightCm = heightCm ? parseFloat(heightCm) : null;
    if (weightKg !== undefined) memberProfileUpdateData.weightKg = weightKg ? parseFloat(weightKg) : null;
    if (fitnessGoal !== undefined) memberProfileUpdateData.fitnessGoal = fitnessGoal;
    if (trainingLevel !== undefined) memberProfileUpdateData.trainingLevel = trainingLevel;
    if (healthCondition !== undefined) memberProfileUpdateData.healthCondition = healthCondition;
    if (medicalNote !== undefined) memberProfileUpdateData.medicalNote = medicalNote;
    if (emergencyContactName !== undefined) memberProfileUpdateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) memberProfileUpdateData.emergencyContactPhone = emergencyContactPhone;

    if (Object.keys(memberProfileUpdateData).length > 0) {
      await MemberProfile.update(memberProfileUpdateData, {
        where: { memberId: member.id }
      });
    }

    // Handle package update: create a new PENDING subscription if packageId is provided and different
    if (packageId) {
      const currentPkgId = member.currentSubscription?.package?.id;
      if (Number(packageId) !== currentPkgId) {
        const pkg = await MembershipPackage.findByPk(packageId);
        if (pkg && pkg.status === 'ACTIVE') {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + pkg.durationMonths);

          await MemberSubscription.create({
            memberId: member.id,
            packageId: pkg.id,
            startDate,
            endDate,
            actualPrice: pkg.price,
            status: 'PENDING',
            registeredBy: (req as any).user?.id
          });
        }
      }
    }

    // Get updated member
    const updatedMember = await Member.findWithFullDetails(member.id);

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: { member: updatedMember }
    });
  } catch (error) {
    throw createError.internal(`Failed to update member: ${(error as Error).message}`);
  }
});

// Delete member (soft delete)
export const deleteMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const member = await Member.findByPk(parseInt(id));

  if (!member) {
    throw createError.notFound('Member not found');
  }

  // Soft delete the member (this will also soft delete associated records due to paranoid: true)
  await member.destroy();

  res.json({
    success: true,
    message: 'Member deleted successfully'
  });
});

// Get member statistics
export const getMemberStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await Member.getStatistics();

  res.json({
    success: true,
    data: { statistics: stats }
  });
});

// Assign trainer to member
export const assignTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { trainerId } = req.body;

  const member = await Member.findByPk(parseInt(id));
  if (!member) {
    throw createError.notFound('Member not found');
  }

  // Check if member has an active paid subscription
  const activeSubscription = await MemberSubscription.findOne({
    where: {
      memberId: member.id,
      status: 'ACTIVE',
      endDate: { [Op.gte]: new Date() }
    },
    include: [{ model: MembershipPackage, as: 'package' }]
  });

  if (!activeSubscription) {
    throw createError.validation(
      'Hội viên chưa có gói tập đang hoạt động (chưa hoàn tất thanh toán/kích hoạt gói tập). Vui lòng đăng ký và thanh toán gói tập trước khi phân công HLV.'
    );
  }

  if (activeSubscription.package && !activeSubscription.package.allowTrainer) {
    throw createError.validation(
      `Gói tập hiện tại (${activeSubscription.package.name}) không hỗ trợ dịch vụ Huấn luyện viên cá nhân.`
    );
  }

  // Verify trainer exists and is active
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer || trainer.status !== 'ACTIVE') {
    throw createError.validation('Invalid or inactive trainer');
  }

  // Update member's assigned trainer
  await member.update({ assignedTrainerId: trainerId });

  // Get updated member with trainer info
  const updatedMember = await Member.findWithFullDetails(member.id);

  res.json({
    success: true,
    message: 'Trainer assigned successfully',
    data: { member: updatedMember }
  });
});

// Remove trainer from member
export const removeTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const member = await Member.findByPk(parseInt(id));
  if (!member) {
    throw createError.notFound('Member not found');
  }

  // Remove assigned trainer
  await member.update({ assignedTrainerId: null });

  // Get updated member
  const updatedMember = await Member.findWithFullDetails(member.id);

  res.json({
    success: true,
    message: 'Trainer removed successfully',
    data: { member: updatedMember }
  });
});

// Get members by trainer
export const getMembersByTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { trainerId } = req.params;
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const whereClause: any = { assignedTrainerId: trainerId };

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

// Get member's current user (for member role accessing their own data)
export const getCurrentMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const member = await Member.findOne({
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
        association: 'assignedTrainer',
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'email'],
            include: [
              {
                association: 'profile',
                attributes: ['id', 'fullName', 'avatarUrl']
              }
            ]
          }
        ],
        required: false
      }
    ]
  });

  if (!member) {
    throw createError.notFound('Member profile not found');
  }

  res.json({
    success: true,
    data: { member }
  });
});

// Helper: resolve the Member record for the current authenticated user
const getMemberForUser = async (userId: number): Promise<any> => {
  const member: any = await Member.findOne({ where: { userId }, raw: true });
  if (!member) {
    throw createError.notFound('Member profile not found');
  }
  return member;
};

// Get current member's preferences (creates defaults if none exist)
export const getMyPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const member = await getMemberForUser(user.id);

  let preferences: any = await MemberPreference.findOne({ where: { memberId: member.id }, raw: true });

  // Lazily create defaults on first access
  if (!preferences) {
    await MemberPreference.create({ memberId: member.id } as any);
    preferences = await MemberPreference.findOne({ where: { memberId: member.id }, raw: true });
  }

  res.json({
    success: true,
    data: { preferences }
  });
});

// Update current member's preferences
export const updateMyPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const member = await getMemberForUser(user.id);

  const {
    notifyEmail,
    notifySms,
    notifyPush,
    notifyWorkoutReminders,
    notifySubscriptionExpiry,
    notifyTrainerMessages,
    profileVisibility,
    showProgress,
    showStats
  } = req.body;

  // Only include fields that were actually provided
  const updates: any = {};
  if (notifyEmail !== undefined) updates.notifyEmail = notifyEmail;
  if (notifySms !== undefined) updates.notifySms = notifySms;
  if (notifyPush !== undefined) updates.notifyPush = notifyPush;
  if (notifyWorkoutReminders !== undefined) updates.notifyWorkoutReminders = notifyWorkoutReminders;
  if (notifySubscriptionExpiry !== undefined) updates.notifySubscriptionExpiry = notifySubscriptionExpiry;
  if (notifyTrainerMessages !== undefined) updates.notifyTrainerMessages = notifyTrainerMessages;
  if (profileVisibility !== undefined) updates.profileVisibility = profileVisibility;
  if (showProgress !== undefined) updates.showProgress = showProgress;
  if (showStats !== undefined) updates.showStats = showStats;

  const existing: any = await MemberPreference.findOne({ where: { memberId: member.id }, raw: true });

  if (existing) {
    await MemberPreference.update(updates, { where: { memberId: member.id } });
  } else {
    await MemberPreference.create({ memberId: member.id, ...updates } as any);
  }

  const preferences = await MemberPreference.findOne({ where: { memberId: member.id }, raw: true });

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences }
  });
});

// ---------- /me/* endpoints for the authenticated member ----------

async function resolveMember(req: Request): Promise<any> {
  const user = req.user!;
  const m = await Member.findOne({ where: { userId: user.id }, raw: true });
  if (!m) throw createError.forbidden('No member profile for this user');
  return m;
}

export const getMyDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await resolveMember(req);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStr = now.toISOString().split('T')[0];

  const currentSub: any = await MemberSubscription.findOne({
    where: { memberId: member.id, status: 'ACTIVE' },
    include: [{ association: 'package', attributes: ['name'] }],
    order: [['start_date', 'DESC']] as any,
    raw: true,
    nest: true,
  });

  let currentSubscription: any = null;
  let daysLeftInSubscription = 0;
  if (currentSub) {
    const end = new Date(currentSub.endDate);
    const start = new Date(currentSub.startDate);
    daysLeftInSubscription = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    const total = Math.max(1, end.getTime() - start.getTime());
    const elapsed = Math.min(total, Math.max(0, now.getTime() - start.getTime()));
    currentSubscription = {
      id: currentSub.id,
      packageName: currentSub.package?.name || 'Unknown',
      startDate: currentSub.startDate,
      endDate: currentSub.endDate,
      actualPrice: Number(currentSub.actualPrice),
      status: currentSub.status,
      daysRemaining: daysLeftInSubscription,
      progressPercent: Math.round((elapsed / total) * 100),
    };
  }

  const profile: any = await sequelize.query(
    `SELECT weight_kg FROM member_profiles WHERE member_id = ${member.id} LIMIT 1`,
    { type: (sequelize as any).QueryTypes.SELECT },
  );
  const currentWeightKg = profile[0]?.weight_kg !== undefined && profile[0]?.weight_kg !== null
    ? Number(profile[0].weight_kg)
    : null;

  const [workoutsThisMonth, checkInsThisMonth] = await Promise.all([
    WorkoutProgressLog.count({
      where: { memberId: member.id, workout_date: { [Op.gte]: startOfMonth } } as any,
    }),
    AttendanceLog.count({
      where: { memberId: member.id, check_in_time: { [Op.gte]: startOfMonth } } as any,
    }),
  ]);

  const [upcomingRowsRaw]: any = await sequelize.query(
    `SELECT
       sm.id AS id,
       sm.attendance_status AS attendanceStatus,
       ts.id AS scheduleId,
       ts.class_name AS className,
       ts.start_date AS startDate,
       ts.start_time AS startTime,
       ts.end_time AS endTime,
       ts.location AS location,
       up.full_name AS trainerName
     FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     LEFT JOIN trainers tr ON ts.trainer_id = tr.id
     LEFT JOIN users u ON tr.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE sm.member_id = ${member.id}
       AND sm.attendance_status = 'REGISTERED'
       AND ts.start_date >= '${todayStr}'
     ORDER BY ts.start_date ASC, ts.start_time ASC
     LIMIT 5`,
  );

  const upcomingSchedules = (upcomingRowsRaw || []).map((r: any) => ({
    id: r.id,
    scheduleId: r.scheduleId,
    className: r.className,
    startDate: r.startDate,
    startTime: r.startTime,
    endTime: r.endTime,
    trainerName: r.trainerName || 'Unassigned',
    location: r.location,
    attendanceStatus: r.attendanceStatus,
  }));

  const recentLogs: any[] = await WorkoutProgressLog.findAll({
    where: { memberId: member.id } as any,
    include: [{ association: 'exercise', attributes: ['name'] }],
    order: [['workout_date', 'DESC']] as any,
    limit: 5,
    raw: true,
    nest: true,
  });

  const recentWorkouts = recentLogs.map((r: any) => ({
    id: r.id,
    workoutDate: r.workoutDate,
    exerciseName: r.exercise?.name || 'Unknown',
    sets: r.setsCompleted,
    reps: r.repsCompleted,
    weightKg: r.weightUsedKg !== null && r.weightUsedKg !== undefined ? Number(r.weightUsedKg) : null,
    durationMinutes: r.durationMinutes,
  }));

  let assignedTrainer: any = null;
  if (member.assignedTrainerId) {
    const trainerRow: any = await Trainer.findOne({
      where: { id: member.assignedTrainerId },
      include: [{ association: 'user', include: [{ association: 'profile' }] }],
      raw: true,
      nest: true,
    });
    if (trainerRow) {
      const [specsRows]: any = await sequelize.query(
        `SELECT s.name FROM specializations s
         INNER JOIN trainer_specializations ts ON ts.specialization_id = s.id
         WHERE ts.trainer_id = ${trainerRow.id}`,
      );
      assignedTrainer = {
        id: trainerRow.id,
        trainerCode: trainerRow.trainerCode,
        fullName: trainerRow.user?.profile?.fullName || 'Unknown',
        avatarUrl: trainerRow.user?.profile?.avatarUrl || null,
        ratingAvg: Number(trainerRow.ratingAvg) || 0,
        specializations: (specsRows || []).map((r: any) => r.name),
      };
    }
  }

  res.json({
    success: true,
    data: {
      stats: {
        daysLeftInSubscription,
        workoutsThisMonth,
        checkInsThisMonth,
        currentWeightKg,
      },
      currentSubscription,
      upcomingSchedules,
      recentWorkouts,
      assignedTrainer,
    },
  });
});

export const getMySchedules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await resolveMember(req);
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

  const baseWhere = `WHERE sm.member_id = ${member.id}`;
  const extraWhere = status ? ` AND sm.attendance_status = '${String(status).replace(/'/g, "''")}'` : '';

  const [countRows]: any = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     ${baseWhere}${extraWhere}`,
  );
  const total = Number(countRows[0]?.cnt || 0);

  const [rows]: any = await sequelize.query(
    `SELECT
       sm.id AS id,
       sm.attendance_status AS attendanceStatus,
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
       up.full_name AS trainerName
     FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     LEFT JOIN trainers tr ON ts.trainer_id = tr.id
     LEFT JOIN users u ON tr.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     ${baseWhere}${extraWhere}
     ORDER BY ts.start_date DESC, ts.start_time DESC
     LIMIT ${parseInt(String(limit), 10)} OFFSET ${offset}`,
  );

  const sessions = (rows || []).map((r: any) => ({
    id: r.id,
    attendanceStatus: r.attendanceStatus,
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
      trainerName: r.trainerName || 'Unassigned',
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

export const getMyAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await resolveMember(req);
  const days = Math.max(1, Math.min(90, parseInt(String(req.query.days || '30'), 10)));
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWindow = new Date(startOfToday);
  startWindow.setDate(startOfToday.getDate() - (days - 1));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourWeeksAgo = new Date(startOfToday);
  fourWeeksAgo.setDate(startOfToday.getDate() - 27);

  const [logs, dailyRowsResult, totalCheckIns, monthCheckIns, last4WeeksCount]: any = await Promise.all([
    AttendanceLog.findAll({
      where: { memberId: member.id } as any,
      order: [['check_in_time', 'DESC']] as any,
      limit: 50,
      raw: true,
    }),
    sequelize.query(
      `SELECT DATE(check_in_time) AS d, COUNT(*) AS cnt FROM attendance_logs
       WHERE member_id = ${member.id} AND check_in_time >= '${startWindow.toISOString().slice(0, 19).replace('T', ' ')}'
       GROUP BY DATE(check_in_time)`,
    ),
    AttendanceLog.count({ where: { memberId: member.id } as any }),
    AttendanceLog.count({ where: { memberId: member.id, check_in_time: { [Op.gte]: startOfMonth } } as any }),
    AttendanceLog.count({ where: { memberId: member.id, check_in_time: { [Op.gte]: fourWeeksAgo } } as any }),
  ]);

  const dailyRows = Array.isArray(dailyRowsResult[0]) ? dailyRowsResult[0] : dailyRowsResult;
  const dailyMap = new Map<string, number>();
  dailyRows.forEach((r: any) => {
    const key = r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d);
    dailyMap.set(key, Number(r.cnt || 0));
  });
  const daily: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startWindow);
    d.setDate(startWindow.getDate() + i);
    const key = d.toISOString().split('T')[0];
    daily.push({ date: key, count: dailyMap.get(key) || 0 });
  }

  let currentStreak = 0;
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].count > 0) currentStreak++;
    else break;
  }
  if (currentStreak === 0 && daily.length >= 2) {
    for (let i = daily.length - 2; i >= 0; i--) {
      if (daily[i].count > 0) currentStreak++;
      else break;
    }
  }

  const averagePerWeek = Math.round((Number(last4WeeksCount || 0) / 4) * 10) / 10;

  res.json({
    success: true,
    data: {
      logs: (logs as any[]).map((l: any) => ({
        id: l.id,
        checkinTime: l.checkinTime,
        checkoutTime: l.checkoutTime,
        attendanceType: l.attendanceType,
      })),
      daily,
      stats: {
        totalCheckIns: Number(totalCheckIns || 0),
        monthCheckIns: Number(monthCheckIns || 0),
        currentStreak,
        averagePerWeek,
      },
    },
  });
});

export const getMyPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await resolveMember(req);
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

  const total = await Payment.count({ where: { memberId: member.id } as any });
  const rows: any[] = await Payment.findAll({
    where: { memberId: member.id } as any,
    include: [
      {
        association: 'subscription',
        attributes: ['id'],
        include: [{ association: 'package', attributes: ['name'] }],
      },
    ],
    order: [['payment_date', 'DESC']] as any,
    limit: parseInt(String(limit), 10),
    offset,
    raw: true,
    nest: true,
  });

  const payments = rows.map((p: any) => ({
    id: p.id,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    paymentType: p.paymentType,
    paymentDate: p.paymentDate,
    paymentStatus: p.paymentStatus,
    transactionReference: p.transactionReference,
    notes: p.notes,
    subscription: p.subscription?.id ? {
      id: p.subscription.id,
      packageName: p.subscription.package?.name || null,
    } : null,
  }));

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit), 10)),
      },
    },
  });
});

export const bookMySchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await resolveMember(req);
  const scheduleId = parseInt(req.params.scheduleId, 10);
  if (!Number.isInteger(scheduleId)) throw createError.validation('Invalid scheduleId');

  // Check that the member has an active, paid subscription
  const activeSubscription = await MemberSubscription.findOne({
    where: { memberId: member.id, status: 'ACTIVE' } as any,
    raw: true,
  });
  if (!activeSubscription) {
    throw createError.validation('Bạn cần có gói tập đang hoạt động để đặt lịch. Vui lòng thanh toán gói tập trước.');
  }

  const schedule: any = await TrainingSchedule.findByPk(scheduleId, { raw: true });
  if (!schedule) throw createError.notFound('Schedule not found');
  if (schedule.status !== 'SCHEDULED') throw createError.validation('Schedule is not bookable');
  const today = new Date().toISOString().split('T')[0];
  if (String(schedule.startDate).slice(0, 10) < today) throw createError.validation('Schedule already started');

  const existing: any = await ScheduleMember.findOne({
    where: { scheduleId, memberId: member.id } as any,
    raw: true,
  });
  if (existing && ['REGISTERED', 'ATTENDED'].includes(existing.status)) {
    throw createError.validation('Already booked');
  }
  if (Number(schedule.currentEnrollment || 0) >= Number(schedule.maxCapacity || 0)) {
    throw createError.validation('Schedule is full');
  }

  const t = await sequelize.transaction();
  try {
    let row: any;
    if (existing) {
      await ScheduleMember.update(
        { status: 'REGISTERED' as any, registeredAt: new Date() } as any,
        { where: { id: existing.id }, transaction: t },
      );
      row = await ScheduleMember.findByPk(existing.id, { raw: true, transaction: t });
    } else {
      row = await ScheduleMember.create({
        scheduleId, memberId: member.id, status: 'REGISTERED', registeredAt: new Date(),
      } as any, { transaction: t });
    }
    await sequelize.query(
      `UPDATE training_schedules SET current_enrollment = current_enrollment + 1 WHERE id = ${scheduleId}`,
      { transaction: t },
    );
    await t.commit();

    res.json({
      success: true,
      data: {
        booking: {
          id: row.id,
          scheduleId,
          memberId: member.id,
          attendanceStatus: 'REGISTERED',
        },
      },
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

export const cancelMyBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await resolveMember(req);
  const scheduleId = parseInt(req.params.scheduleId, 10);
  if (!Number.isInteger(scheduleId)) throw createError.validation('Invalid scheduleId');

  const schedule: any = await TrainingSchedule.findByPk(scheduleId, { raw: true });
  if (!schedule) throw createError.notFound('Schedule not found');
  const today = new Date().toISOString().split('T')[0];
  if (String(schedule.startDate).slice(0, 10) < today) {
    throw createError.validation('Cannot cancel past schedules');
  }

  const existing: any = await ScheduleMember.findOne({
    where: { scheduleId, memberId: member.id, status: 'REGISTERED' } as any,
    raw: true,
  });
  if (!existing) throw createError.notFound('No active booking found');

  const t = await sequelize.transaction();
  try {
    await ScheduleMember.update(
      { status: 'CANCELLED' as any } as any,
      { where: { id: existing.id }, transaction: t },
    );
    await sequelize.query(
      `UPDATE training_schedules SET current_enrollment = GREATEST(current_enrollment - 1, 0) WHERE id = ${scheduleId}`,
      { transaction: t },
    );
    await t.commit();

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

export default {
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
};