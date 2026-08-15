"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMyBooking = exports.bookMySchedule = exports.getMyPayments = exports.getMyAttendance = exports.getMySchedules = exports.getMyDashboard = exports.updateMyPreferences = exports.getMyPreferences = exports.getCurrentMember = exports.getMembersByTrainer = exports.removeTrainer = exports.assignTrainer = exports.getMemberStatistics = exports.deleteMember = exports.updateMember = exports.createMember = exports.getMemberByCode = exports.getMemberById = exports.getMembers = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
const Member_model_1 = require("@/models/Member.model");
const User_model_1 = require("@/models/User.model");
const UserProfile_model_1 = require("@/models/UserProfile.model");
const Role_model_1 = require("@/models/Role.model");
const Trainer_model_1 = require("@/models/Trainer.model");
const Subscription_model_1 = require("@/models/Subscription.model");
const Schedule_model_1 = require("@/models/Schedule.model");
const Exercise_model_1 = require("@/models/Exercise.model");
const Payment_model_1 = require("@/models/Payment.model");
const password_1 = require("@/utils/password");
const error_middleware_1 = require("@/middlewares/error.middleware");
const logger_1 = require("@/utils/logger");
// Get all members with pagination and filtering
exports.getMembers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search, status, trainerId, sortBy = 'joinDate', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};
    const userWhereClause = {};
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
        userWhereClause[sequelize_1.Op.or] = [
            { email: { [sequelize_1.Op.like]: searchTerm } },
            { username: { [sequelize_1.Op.like]: searchTerm } },
            { '$user.profile.fullName$': { [sequelize_1.Op.like]: searchTerm } },
            { memberCode: { [sequelize_1.Op.like]: searchTerm } }
        ];
    }
    const { rows: members, count } = await Member_model_1.Member.findAndCountAll({
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
            }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset,
        distinct: true
    });
    const totalPages = Math.ceil(count / parseInt(limit));
    res.json({
        success: true,
        data: {
            members,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages
            }
        }
    });
});
// Get member by ID
exports.getMemberById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const member = await Member_model_1.Member.findWithFullDetails(parseInt(id));
    if (!member) {
        throw error_middleware_1.createError.notFound('Member not found');
    }
    res.json({
        success: true,
        data: { member }
    });
});
// Get member by member code
exports.getMemberByCode = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { memberCode } = req.params;
    const member = await Member_model_1.Member.findByMemberCode(memberCode);
    if (!member) {
        throw error_middleware_1.createError.notFound('Member not found');
    }
    res.json({
        success: true,
        data: { member }
    });
});
// Create new member
exports.createMember = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { 
    // User data
    username, email, password, phone, 
    // User profile data
    fullName, gender = 'OTHER', dateOfBirth, address, bio, 
    // Member data
    joinDate = new Date(), assignedTrainerId, note, 
    // Member profile data
    heightCm, weightKg, fitnessGoal, trainingLevel = 'BEGINNER', healthCondition, medicalNote, emergencyContactName, emergencyContactPhone } = req.body;
    // Check if user with email or username already exists
    const existingUser = await User_model_1.User.findOne({
        where: {
            [sequelize_1.Op.or]: [{ email }, { username }]
        }
    });
    if (existingUser) {
        throw error_middleware_1.createError.conflict('User with this email or username already exists');
    }
    // Verify assigned trainer exists if provided
    if (assignedTrainerId) {
        const trainer = await Trainer_model_1.Trainer.findByPk(assignedTrainerId);
        if (!trainer || trainer.status !== 'ACTIVE') {
            throw error_middleware_1.createError.validation('Invalid or inactive trainer assigned');
        }
    }
    try {
        // Get member role
        const memberRole = await Role_model_1.Role.findByName('MEMBER');
        if (!memberRole) {
            throw error_middleware_1.createError.internal('Member role not found');
        }
        // Hash password
        const passwordHash = await (0, password_1.hashPassword)(password);
        // Generate member code
        const memberCode = await Member_model_1.Member.generateMemberCode();
        // Create user
        const user = await User_model_1.User.create({
            roleId: memberRole.id,
            username,
            email,
            passwordHash,
            phone,
            status: 'ACTIVE'
        });
        // Create user profile
        await UserProfile_model_1.UserProfile.create({
            userId: user.id,
            fullName,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            address,
            bio
        });
        // Create member
        const member = await Member_model_1.Member.create({
            userId: user.id,
            memberCode,
            joinDate: new Date(joinDate),
            membershipStatus: 'ACTIVE',
            assignedTrainerId: assignedTrainerId || undefined,
            note
        });
        // Create member profile
        const memberProfile = await Member_model_1.MemberProfile.create({
            memberId: member.id,
            heightCm: heightCm ? parseFloat(heightCm) : undefined,
            weightKg: weightKg ? parseFloat(weightKg) : undefined,
            fitnessGoal,
            trainingLevel,
            healthCondition,
            medicalNote,
            emergencyContactName,
            emergencyContactPhone
        });
        // Get the complete member with all associations
        const newMember = await Member_model_1.Member.findWithFullDetails(member.id);
        logger_1.loggers.business.memberRegistered(member.id, memberCode);
        res.status(201).json({
            success: true,
            message: 'Member created successfully',
            data: { member: newMember }
        });
    }
    catch (error) {
        throw error_middleware_1.createError.internal(`Failed to create member: ${error.message}`);
    }
});
// Update member
exports.updateMember = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { 
    // User data
    phone, status, 
    // User profile data
    fullName, gender, dateOfBirth, address, bio, 
    // Member data
    membershipStatus, assignedTrainerId, note, 
    // Member profile data
    heightCm, weightKg, fitnessGoal, trainingLevel, healthCondition, medicalNote, emergencyContactName, emergencyContactPhone } = req.body;
    const member = await Member_model_1.Member.findWithFullDetails(parseInt(id));
    if (!member) {
        throw error_middleware_1.createError.notFound('Member not found');
    }
    // Verify assigned trainer if provided
    if (assignedTrainerId && assignedTrainerId !== member.assignedTrainerId) {
        const trainer = await Trainer_model_1.Trainer.findByPk(assignedTrainerId);
        if (!trainer || trainer.status !== 'ACTIVE') {
            throw error_middleware_1.createError.validation('Invalid or inactive trainer assigned');
        }
    }
    try {
        // Update user data
        const userUpdateData = {};
        if (phone !== undefined)
            userUpdateData.phone = phone;
        if (status !== undefined)
            userUpdateData.status = status;
        if (Object.keys(userUpdateData).length > 0) {
            await member.user.update(userUpdateData);
        }
        // Update user profile data
        const profileUpdateData = {};
        if (fullName !== undefined)
            profileUpdateData.fullName = fullName;
        if (gender !== undefined)
            profileUpdateData.gender = gender;
        if (dateOfBirth !== undefined) {
            profileUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }
        if (address !== undefined)
            profileUpdateData.address = address;
        if (bio !== undefined)
            profileUpdateData.bio = bio;
        if (Object.keys(profileUpdateData).length > 0) {
            await UserProfile_model_1.UserProfile.update(profileUpdateData, {
                where: { userId: member.userId }
            });
        }
        // Update member data
        const memberUpdateData = {};
        if (membershipStatus !== undefined)
            memberUpdateData.membershipStatus = membershipStatus;
        if (assignedTrainerId !== undefined)
            memberUpdateData.assignedTrainerId = assignedTrainerId;
        if (note !== undefined)
            memberUpdateData.note = note;
        if (Object.keys(memberUpdateData).length > 0) {
            await member.update(memberUpdateData);
        }
        // Update member profile data
        const memberProfileUpdateData = {};
        if (heightCm !== undefined)
            memberProfileUpdateData.heightCm = heightCm ? parseFloat(heightCm) : null;
        if (weightKg !== undefined)
            memberProfileUpdateData.weightKg = weightKg ? parseFloat(weightKg) : null;
        if (fitnessGoal !== undefined)
            memberProfileUpdateData.fitnessGoal = fitnessGoal;
        if (trainingLevel !== undefined)
            memberProfileUpdateData.trainingLevel = trainingLevel;
        if (healthCondition !== undefined)
            memberProfileUpdateData.healthCondition = healthCondition;
        if (medicalNote !== undefined)
            memberProfileUpdateData.medicalNote = medicalNote;
        if (emergencyContactName !== undefined)
            memberProfileUpdateData.emergencyContactName = emergencyContactName;
        if (emergencyContactPhone !== undefined)
            memberProfileUpdateData.emergencyContactPhone = emergencyContactPhone;
        if (Object.keys(memberProfileUpdateData).length > 0) {
            await Member_model_1.MemberProfile.update(memberProfileUpdateData, {
                where: { memberId: member.id }
            });
        }
        // Get updated member
        const updatedMember = await Member_model_1.Member.findWithFullDetails(member.id);
        res.json({
            success: true,
            message: 'Member updated successfully',
            data: { member: updatedMember }
        });
    }
    catch (error) {
        throw error_middleware_1.createError.internal(`Failed to update member: ${error.message}`);
    }
});
// Delete member (soft delete)
exports.deleteMember = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const member = await Member_model_1.Member.findByPk(parseInt(id));
    if (!member) {
        throw error_middleware_1.createError.notFound('Member not found');
    }
    // Soft delete the member (this will also soft delete associated records due to paranoid: true)
    await member.destroy();
    res.json({
        success: true,
        message: 'Member deleted successfully'
    });
});
// Get member statistics
exports.getMemberStatistics = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const stats = await Member_model_1.Member.getStatistics();
    res.json({
        success: true,
        data: { statistics: stats }
    });
});
// Assign trainer to member
exports.assignTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { trainerId } = req.body;
    const member = await Member_model_1.Member.findByPk(parseInt(id));
    if (!member) {
        throw error_middleware_1.createError.notFound('Member not found');
    }
    // Verify trainer exists and is active
    const trainer = await Trainer_model_1.Trainer.findByPk(trainerId);
    if (!trainer || trainer.status !== 'ACTIVE') {
        throw error_middleware_1.createError.validation('Invalid or inactive trainer');
    }
    // Update member's assigned trainer
    await member.update({ assignedTrainerId: trainerId });
    // Get updated member with trainer info
    const updatedMember = await Member_model_1.Member.findWithFullDetails(member.id);
    res.json({
        success: true,
        message: 'Trainer assigned successfully',
        data: { member: updatedMember }
    });
});
// Remove trainer from member
exports.removeTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const member = await Member_model_1.Member.findByPk(parseInt(id));
    if (!member) {
        throw error_middleware_1.createError.notFound('Member not found');
    }
    // Remove assigned trainer
    await member.update({ assignedTrainerId: null });
    // Get updated member
    const updatedMember = await Member_model_1.Member.findWithFullDetails(member.id);
    res.json({
        success: true,
        message: 'Trainer removed successfully',
        data: { member: updatedMember }
    });
});
// Get members by trainer
exports.getMembersByTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { trainerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { assignedTrainerId: trainerId };
    if (status) {
        whereClause.membershipStatus = status;
    }
    const { rows: members, count } = await Member_model_1.Member.findAndCountAll({
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
        limit: parseInt(limit),
        offset,
        distinct: true
    });
    const totalPages = Math.ceil(count / parseInt(limit));
    res.json({
        success: true,
        data: {
            members,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages
            }
        }
    });
});
// Get member's current user (for member role accessing their own data)
exports.getCurrentMember = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const member = await Member_model_1.Member.findOne({
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
        throw error_middleware_1.createError.notFound('Member profile not found');
    }
    res.json({
        success: true,
        data: { member }
    });
});
// Helper: resolve the Member record for the current authenticated user
const getMemberForUser = async (userId) => {
    const member = await Member_model_1.Member.findOne({ where: { userId }, raw: true });
    if (!member) {
        throw error_middleware_1.createError.notFound('Member profile not found');
    }
    return member;
};
// Get current member's preferences (creates defaults if none exist)
exports.getMyPreferences = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const member = await getMemberForUser(user.id);
    let preferences = await Member_model_1.MemberPreference.findOne({ where: { memberId: member.id }, raw: true });
    // Lazily create defaults on first access
    if (!preferences) {
        await Member_model_1.MemberPreference.create({ memberId: member.id });
        preferences = await Member_model_1.MemberPreference.findOne({ where: { memberId: member.id }, raw: true });
    }
    res.json({
        success: true,
        data: { preferences }
    });
});
// Update current member's preferences
exports.updateMyPreferences = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const member = await getMemberForUser(user.id);
    const { notifyEmail, notifySms, notifyPush, notifyWorkoutReminders, notifySubscriptionExpiry, notifyTrainerMessages, profileVisibility, showProgress, showStats } = req.body;
    // Only include fields that were actually provided
    const updates = {};
    if (notifyEmail !== undefined)
        updates.notifyEmail = notifyEmail;
    if (notifySms !== undefined)
        updates.notifySms = notifySms;
    if (notifyPush !== undefined)
        updates.notifyPush = notifyPush;
    if (notifyWorkoutReminders !== undefined)
        updates.notifyWorkoutReminders = notifyWorkoutReminders;
    if (notifySubscriptionExpiry !== undefined)
        updates.notifySubscriptionExpiry = notifySubscriptionExpiry;
    if (notifyTrainerMessages !== undefined)
        updates.notifyTrainerMessages = notifyTrainerMessages;
    if (profileVisibility !== undefined)
        updates.profileVisibility = profileVisibility;
    if (showProgress !== undefined)
        updates.showProgress = showProgress;
    if (showStats !== undefined)
        updates.showStats = showStats;
    const existing = await Member_model_1.MemberPreference.findOne({ where: { memberId: member.id }, raw: true });
    if (existing) {
        await Member_model_1.MemberPreference.update(updates, { where: { memberId: member.id } });
    }
    else {
        await Member_model_1.MemberPreference.create({ memberId: member.id, ...updates });
    }
    const preferences = await Member_model_1.MemberPreference.findOne({ where: { memberId: member.id }, raw: true });
    res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences }
    });
});
// ---------- /me/* endpoints for the authenticated member ----------
async function resolveMember(req) {
    const user = req.user;
    const m = await Member_model_1.Member.findOne({ where: { userId: user.id }, raw: true });
    if (!m)
        throw error_middleware_1.createError.forbidden('No member profile for this user');
    return m;
}
exports.getMyDashboard = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const member = await resolveMember(req);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().split('T')[0];
    const currentSub = await Subscription_model_1.MemberSubscription.findOne({
        where: { memberId: member.id, status: 'ACTIVE' },
        include: [{ association: 'package', attributes: ['name'] }],
        order: [['start_date', 'DESC']],
        raw: true,
        nest: true,
    });
    let currentSubscription = null;
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
    const profile = await database_config_1.default.query(`SELECT weight_kg FROM member_profiles WHERE member_id = ${member.id} LIMIT 1`, { type: database_config_1.default.QueryTypes.SELECT });
    const currentWeightKg = profile[0]?.weight_kg !== undefined && profile[0]?.weight_kg !== null
        ? Number(profile[0].weight_kg)
        : null;
    const [workoutsThisMonth, checkInsThisMonth] = await Promise.all([
        Exercise_model_1.WorkoutProgressLog.count({
            where: { memberId: member.id, workout_date: { [sequelize_1.Op.gte]: startOfMonth } },
        }),
        Schedule_model_1.AttendanceLog.count({
            where: { memberId: member.id, check_in_time: { [sequelize_1.Op.gte]: startOfMonth } },
        }),
    ]);
    const [upcomingRowsRaw] = await database_config_1.default.query(`SELECT
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
     LIMIT 5`);
    const upcomingSchedules = (upcomingRowsRaw || []).map((r) => ({
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
    const recentLogs = await Exercise_model_1.WorkoutProgressLog.findAll({
        where: { memberId: member.id },
        include: [{ association: 'exercise', attributes: ['name'] }],
        order: [['workout_date', 'DESC']],
        limit: 5,
        raw: true,
        nest: true,
    });
    const recentWorkouts = recentLogs.map((r) => ({
        id: r.id,
        workoutDate: r.workoutDate,
        exerciseName: r.exercise?.name || 'Unknown',
        sets: r.setsCompleted,
        reps: r.repsCompleted,
        weightKg: r.weightUsedKg !== null && r.weightUsedKg !== undefined ? Number(r.weightUsedKg) : null,
        durationMinutes: r.durationMinutes,
    }));
    let assignedTrainer = null;
    if (member.assignedTrainerId) {
        const trainerRow = await Trainer_model_1.Trainer.findOne({
            where: { id: member.assignedTrainerId },
            include: [{ association: 'user', include: [{ association: 'profile' }] }],
            raw: true,
            nest: true,
        });
        if (trainerRow) {
            const [specsRows] = await database_config_1.default.query(`SELECT s.name FROM specializations s
         INNER JOIN trainer_specializations ts ON ts.specialization_id = s.id
         WHERE ts.trainer_id = ${trainerRow.id}`);
            assignedTrainer = {
                id: trainerRow.id,
                trainerCode: trainerRow.trainerCode,
                fullName: trainerRow.user?.profile?.fullName || 'Unknown',
                avatarUrl: trainerRow.user?.profile?.avatarUrl || null,
                ratingAvg: Number(trainerRow.ratingAvg) || 0,
                specializations: (specsRows || []).map((r) => r.name),
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
exports.getMySchedules = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const member = await resolveMember(req);
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    const baseWhere = `WHERE sm.member_id = ${member.id}`;
    const extraWhere = status ? ` AND sm.attendance_status = '${String(status).replace(/'/g, "''")}'` : '';
    const [countRows] = await database_config_1.default.query(`SELECT COUNT(*) AS cnt FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     ${baseWhere}${extraWhere}`);
    const total = Number(countRows[0]?.cnt || 0);
    const [rows] = await database_config_1.default.query(`SELECT
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
     LIMIT ${parseInt(String(limit), 10)} OFFSET ${offset}`);
    const sessions = (rows || []).map((r) => ({
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
exports.getMyAttendance = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const member = await resolveMember(req);
    const days = Math.max(1, Math.min(90, parseInt(String(req.query.days || '30'), 10)));
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWindow = new Date(startOfToday);
    startWindow.setDate(startOfToday.getDate() - (days - 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fourWeeksAgo = new Date(startOfToday);
    fourWeeksAgo.setDate(startOfToday.getDate() - 27);
    const [logs, dailyRowsResult, totalCheckIns, monthCheckIns, last4WeeksCount] = await Promise.all([
        Schedule_model_1.AttendanceLog.findAll({
            where: { memberId: member.id },
            order: [['check_in_time', 'DESC']],
            limit: 50,
            raw: true,
        }),
        database_config_1.default.query(`SELECT DATE(check_in_time) AS d, COUNT(*) AS cnt FROM attendance_logs
       WHERE member_id = ${member.id} AND check_in_time >= '${startWindow.toISOString().slice(0, 19).replace('T', ' ')}'
       GROUP BY DATE(check_in_time)`),
        Schedule_model_1.AttendanceLog.count({ where: { memberId: member.id } }),
        Schedule_model_1.AttendanceLog.count({ where: { memberId: member.id, check_in_time: { [sequelize_1.Op.gte]: startOfMonth } } }),
        Schedule_model_1.AttendanceLog.count({ where: { memberId: member.id, check_in_time: { [sequelize_1.Op.gte]: fourWeeksAgo } } }),
    ]);
    const dailyRows = Array.isArray(dailyRowsResult[0]) ? dailyRowsResult[0] : dailyRowsResult;
    const dailyMap = new Map();
    dailyRows.forEach((r) => {
        const key = r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d);
        dailyMap.set(key, Number(r.cnt || 0));
    });
    const daily = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startWindow);
        d.setDate(startWindow.getDate() + i);
        const key = d.toISOString().split('T')[0];
        daily.push({ date: key, count: dailyMap.get(key) || 0 });
    }
    let currentStreak = 0;
    for (let i = daily.length - 1; i >= 0; i--) {
        if (daily[i].count > 0)
            currentStreak++;
        else
            break;
    }
    if (currentStreak === 0 && daily.length >= 2) {
        for (let i = daily.length - 2; i >= 0; i--) {
            if (daily[i].count > 0)
                currentStreak++;
            else
                break;
        }
    }
    const averagePerWeek = Math.round((Number(last4WeeksCount || 0) / 4) * 10) / 10;
    res.json({
        success: true,
        data: {
            logs: logs.map((l) => ({
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
exports.getMyPayments = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const member = await resolveMember(req);
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    const total = await Payment_model_1.Payment.count({ where: { memberId: member.id } });
    const rows = await Payment_model_1.Payment.findAll({
        where: { memberId: member.id },
        include: [
            {
                association: 'subscription',
                attributes: ['id'],
                include: [{ association: 'package', attributes: ['name'] }],
            },
        ],
        order: [['payment_date', 'DESC']],
        limit: parseInt(String(limit), 10),
        offset,
        raw: true,
        nest: true,
    });
    const payments = rows.map((p) => ({
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
exports.bookMySchedule = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const member = await resolveMember(req);
    const scheduleId = parseInt(req.params.scheduleId, 10);
    if (!Number.isInteger(scheduleId))
        throw error_middleware_1.createError.validation('Invalid scheduleId');
    const schedule = await Schedule_model_1.TrainingSchedule.findByPk(scheduleId, { raw: true });
    if (!schedule)
        throw error_middleware_1.createError.notFound('Schedule not found');
    if (schedule.status !== 'SCHEDULED')
        throw error_middleware_1.createError.validation('Schedule is not bookable');
    const today = new Date().toISOString().split('T')[0];
    if (String(schedule.startDate).slice(0, 10) < today)
        throw error_middleware_1.createError.validation('Schedule already started');
    const existing = await Schedule_model_1.ScheduleMember.findOne({
        where: { scheduleId, memberId: member.id },
        raw: true,
    });
    if (existing && ['REGISTERED', 'ATTENDED'].includes(existing.status)) {
        throw error_middleware_1.createError.validation('Already booked');
    }
    if (Number(schedule.currentEnrollment || 0) >= Number(schedule.maxCapacity || 0)) {
        throw error_middleware_1.createError.validation('Schedule is full');
    }
    const t = await database_config_1.default.transaction();
    try {
        let row;
        if (existing) {
            await Schedule_model_1.ScheduleMember.update({ status: 'REGISTERED', registeredAt: new Date() }, { where: { id: existing.id }, transaction: t });
            row = await Schedule_model_1.ScheduleMember.findByPk(existing.id, { raw: true, transaction: t });
        }
        else {
            row = await Schedule_model_1.ScheduleMember.create({
                scheduleId, memberId: member.id, status: 'REGISTERED', registeredAt: new Date(),
            }, { transaction: t });
        }
        await database_config_1.default.query(`UPDATE training_schedules SET current_enrollment = current_enrollment + 1 WHERE id = ${scheduleId}`, { transaction: t });
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
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
});
exports.cancelMyBooking = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const member = await resolveMember(req);
    const scheduleId = parseInt(req.params.scheduleId, 10);
    if (!Number.isInteger(scheduleId))
        throw error_middleware_1.createError.validation('Invalid scheduleId');
    const schedule = await Schedule_model_1.TrainingSchedule.findByPk(scheduleId, { raw: true });
    if (!schedule)
        throw error_middleware_1.createError.notFound('Schedule not found');
    const today = new Date().toISOString().split('T')[0];
    if (String(schedule.startDate).slice(0, 10) < today) {
        throw error_middleware_1.createError.validation('Cannot cancel past schedules');
    }
    const existing = await Schedule_model_1.ScheduleMember.findOne({
        where: { scheduleId, memberId: member.id, status: 'REGISTERED' },
        raw: true,
    });
    if (!existing)
        throw error_middleware_1.createError.notFound('No active booking found');
    const t = await database_config_1.default.transaction();
    try {
        await Schedule_model_1.ScheduleMember.update({ status: 'CANCELLED' }, { where: { id: existing.id }, transaction: t });
        await database_config_1.default.query(`UPDATE training_schedules SET current_enrollment = GREATEST(current_enrollment - 1, 0) WHERE id = ${scheduleId}`, { transaction: t });
        await t.commit();
        res.json({ success: true, message: 'Booking cancelled' });
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
});
exports.default = {
    getMembers: exports.getMembers,
    getMemberById: exports.getMemberById,
    getMemberByCode: exports.getMemberByCode,
    createMember: exports.createMember,
    updateMember: exports.updateMember,
    deleteMember: exports.deleteMember,
    getMemberStatistics: exports.getMemberStatistics,
    assignTrainer: exports.assignTrainer,
    removeTrainer: exports.removeTrainer,
    getMembersByTrainer: exports.getMembersByTrainer,
    getCurrentMember: exports.getCurrentMember,
    getMyPreferences: exports.getMyPreferences,
    updateMyPreferences: exports.updateMyPreferences,
    getMyDashboard: exports.getMyDashboard,
    getMySchedules: exports.getMySchedules,
    getMyAttendance: exports.getMyAttendance,
    getMyPayments: exports.getMyPayments,
    bookMySchedule: exports.bookMySchedule,
    cancelMyBooking: exports.cancelMyBooking
};
//# sourceMappingURL=member.controller.js.map