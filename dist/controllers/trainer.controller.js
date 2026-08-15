"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyDashboard = exports.getMyMemberSessions = exports.getMyMembers = exports.updateSpecialization = exports.createSpecialization = exports.getSpecializations = exports.getCurrentTrainer = exports.getTrainerMembers = exports.getTrainerStatistics = exports.deleteTrainer = exports.updateTrainer = exports.createTrainer = exports.getTrainerByCode = exports.getTrainerById = exports.getActiveTrainers = exports.getTrainers = void 0;
const sequelize_1 = require("sequelize");
const Trainer_model_1 = require("@/models/Trainer.model");
const User_model_1 = require("@/models/User.model");
const UserProfile_model_1 = require("@/models/UserProfile.model");
const Role_model_1 = require("@/models/Role.model");
const Member_model_1 = require("@/models/Member.model");
const Schedule_model_1 = require("@/models/Schedule.model");
const password_1 = require("@/utils/password");
const error_middleware_1 = require("@/middlewares/error.middleware");
// Get all trainers with pagination and filtering
exports.getTrainers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search, status, specializationId, sortBy = 'ratingAvg', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};
    const userWhereClause = {};
    // Filter by trainer status
    if (status) {
        whereClause.status = status;
    }
    // Search functionality
    if (search) {
        const searchTerm = `%${search}%`;
        userWhereClause[sequelize_1.Op.or] = [
            { email: { [sequelize_1.Op.like]: searchTerm } },
            { username: { [sequelize_1.Op.like]: searchTerm } },
            { '$user.profile.fullName$': { [sequelize_1.Op.like]: searchTerm } },
            { trainerCode: { [sequelize_1.Op.like]: searchTerm } }
        ];
    }
    const includeClause = [
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
    const { rows: trainers, count } = await Trainer_model_1.Trainer.findAndCountAll({
        where: whereClause,
        include: includeClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset,
        distinct: true
    });
    const totalPages = Math.ceil(count / parseInt(limit));
    res.json({
        success: true,
        data: {
            trainers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages
            }
        }
    });
});
// Get active trainers (public endpoint)
exports.getActiveTrainers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { specializationId } = req.query;
    let trainers;
    if (specializationId) {
        trainers = await Trainer_model_1.Trainer.findBySpecialization(parseInt(specializationId));
    }
    else {
        trainers = await Trainer_model_1.Trainer.findActiveTrainers();
    }
    res.json({
        success: true,
        data: { trainers }
    });
});
// Get trainer by ID
exports.getTrainerById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const trainer = await Trainer_model_1.Trainer.findWithFullDetails(parseInt(id));
    if (!trainer) {
        throw error_middleware_1.createError.notFound('Trainer not found');
    }
    res.json({
        success: true,
        data: { trainer }
    });
});
// Get trainer by trainer code
exports.getTrainerByCode = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { trainerCode } = req.params;
    const trainer = await Trainer_model_1.Trainer.findByTrainerCode(trainerCode);
    if (!trainer) {
        throw error_middleware_1.createError.notFound('Trainer not found');
    }
    res.json({
        success: true,
        data: { trainer }
    });
});
// Create new trainer
exports.createTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { 
    // User data
    username, email, password, phone, 
    // User profile data
    fullName, gender = 'OTHER', dateOfBirth, address, bio, 
    // Trainer data
    experienceYears = 0, 
    // Trainer profile data
    certificate, certificatesDetail, education, skills, workExperience, introduction, trainingPhilosophy, achievements, availableTime, facebookUrl, instagramUrl, 
    // Specializations
    specializationIds = [] } = req.body;
    // Check if user with email or username already exists
    const existingUser = await User_model_1.User.findOne({
        where: {
            [sequelize_1.Op.or]: [{ email }, { username }]
        }
    });
    if (existingUser) {
        throw error_middleware_1.createError.conflict('User with this email or username already exists');
    }
    // Verify specializations exist if provided
    if (specializationIds.length > 0) {
        const validSpecializations = await Trainer_model_1.Specialization.findAll({
            where: {
                id: specializationIds,
                status: 'ACTIVE'
            }
        });
        if (validSpecializations.length !== specializationIds.length) {
            throw error_middleware_1.createError.validation('Some specializations are invalid or inactive');
        }
    }
    try {
        // Get trainer role
        const trainerRole = await Role_model_1.Role.findByName('TRAINER');
        if (!trainerRole) {
            throw error_middleware_1.createError.internal('Trainer role not found');
        }
        // Hash password
        const passwordHash = await (0, password_1.hashPassword)(password);
        // Generate trainer code
        const trainerCode = await Trainer_model_1.Trainer.generateTrainerCode();
        // Create user
        const user = await User_model_1.User.create({
            roleId: trainerRole.id,
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
        // Create trainer
        const trainer = await Trainer_model_1.Trainer.create({
            userId: user.id,
            trainerCode,
            experienceYears: parseInt(experienceYears),
            ratingAvg: 0, // Initial rating
            status: 'ACTIVE'
        });
        // Create trainer profile
        await Trainer_model_1.TrainerProfile.create({
            trainerId: trainer.id,
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
            instagramUrl
        });
        // Add specializations if provided
        if (specializationIds.length > 0) {
            const specializations = await Trainer_model_1.Specialization.findAll({
                where: { id: specializationIds }
            });
            await trainer.$set('specializations', specializations);
        }
        // Get the complete trainer with all associations
        const newTrainer = await Trainer_model_1.Trainer.findWithFullDetails(trainer.id);
        res.status(201).json({
            success: true,
            message: 'Trainer created successfully',
            data: { trainer: newTrainer }
        });
    }
    catch (error) {
        throw error_middleware_1.createError.internal(`Failed to create trainer: ${error.message}`);
    }
});
// Update trainer
exports.updateTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { 
    // User data
    phone, status, 
    // User profile data
    fullName, gender, dateOfBirth, address, bio, 
    // Trainer data
    experienceYears, trainerStatus, 
    // Trainer profile data
    certificate, certificatesDetail, education, skills, workExperience, introduction, trainingPhilosophy, achievements, availableTime, facebookUrl, instagramUrl, 
    // Specializations
    specializationIds } = req.body;
    const trainer = await Trainer_model_1.Trainer.findWithFullDetails(parseInt(id));
    if (!trainer) {
        throw error_middleware_1.createError.notFound('Trainer not found');
    }
    // Verify specializations if provided
    if (specializationIds && specializationIds.length > 0) {
        const validSpecializations = await Trainer_model_1.Specialization.findAll({
            where: {
                id: specializationIds,
                status: 'ACTIVE'
            }
        });
        if (validSpecializations.length !== specializationIds.length) {
            throw error_middleware_1.createError.validation('Some specializations are invalid or inactive');
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
            await trainer.user.update(userUpdateData);
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
                where: { userId: trainer.userId }
            });
        }
        // Update trainer data
        const trainerUpdateData = {};
        if (experienceYears !== undefined)
            trainerUpdateData.experienceYears = parseInt(experienceYears);
        if (trainerStatus !== undefined)
            trainerUpdateData.status = trainerStatus;
        if (Object.keys(trainerUpdateData).length > 0) {
            await trainer.update(trainerUpdateData);
        }
        // Update trainer profile data
        const trainerProfileUpdateData = {};
        if (certificate !== undefined)
            trainerProfileUpdateData.certificate = certificate;
        if (certificatesDetail !== undefined)
            trainerProfileUpdateData.certificatesDetail = certificatesDetail;
        if (education !== undefined)
            trainerProfileUpdateData.education = education;
        if (skills !== undefined)
            trainerProfileUpdateData.skills = skills;
        if (workExperience !== undefined)
            trainerProfileUpdateData.workExperience = workExperience;
        if (introduction !== undefined)
            trainerProfileUpdateData.introduction = introduction;
        if (trainingPhilosophy !== undefined)
            trainerProfileUpdateData.trainingPhilosophy = trainingPhilosophy;
        if (achievements !== undefined)
            trainerProfileUpdateData.achievements = achievements;
        if (availableTime !== undefined)
            trainerProfileUpdateData.availableTime = availableTime;
        if (facebookUrl !== undefined)
            trainerProfileUpdateData.facebookUrl = facebookUrl;
        if (instagramUrl !== undefined)
            trainerProfileUpdateData.instagramUrl = instagramUrl;
        if (Object.keys(trainerProfileUpdateData).length > 0) {
            await Trainer_model_1.TrainerProfile.update(trainerProfileUpdateData, {
                where: { trainerId: trainer.id }
            });
        }
        // Update specializations if provided
        if (specializationIds !== undefined) {
            if (specializationIds.length > 0) {
                const specializations = await Trainer_model_1.Specialization.findAll({
                    where: { id: specializationIds }
                });
                await trainer.$set('specializations', specializations);
            }
            else {
                await trainer.$set('specializations', []);
            }
        }
        // Get updated trainer
        const updatedTrainer = await Trainer_model_1.Trainer.findWithFullDetails(trainer.id);
        res.json({
            success: true,
            message: 'Trainer updated successfully',
            data: { trainer: updatedTrainer }
        });
    }
    catch (error) {
        throw error_middleware_1.createError.internal(`Failed to update trainer: ${error.message}`);
    }
});
// Delete trainer (soft delete)
exports.deleteTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const trainer = await Trainer_model_1.Trainer.findByPk(parseInt(id), {
        include: [
            {
                association: 'assignedMembers',
                where: { membershipStatus: 'ACTIVE' },
                required: false
            }
        ]
    });
    if (!trainer) {
        throw error_middleware_1.createError.notFound('Trainer not found');
    }
    // Check if trainer has active members assigned
    if (trainer.assignedMembers && trainer.assignedMembers.length > 0) {
        throw error_middleware_1.createError.conflict('Cannot delete trainer with active assigned members. Please reassign members first.');
    }
    // Soft delete the trainer
    await trainer.destroy();
    res.json({
        success: true,
        message: 'Trainer deleted successfully'
    });
});
// Get trainer statistics
exports.getTrainerStatistics = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const stats = await Trainer_model_1.Trainer.getStatistics();
    res.json({
        success: true,
        data: { statistics: stats }
    });
});
// Get trainer's assigned members
exports.getTrainerMembers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const trainer = await Trainer_model_1.Trainer.findByPk(parseInt(id));
    if (!trainer) {
        throw error_middleware_1.createError.notFound('Trainer not found');
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { assignedTrainerId: trainer.id };
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
            trainer: {
                id: trainer.id,
                trainerCode: trainer.trainerCode
            },
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
// Get current trainer (for trainer role accessing their own data)
exports.getCurrentTrainer = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const trainer = await Trainer_model_1.Trainer.findOne({
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
        throw error_middleware_1.createError.notFound('Trainer profile not found');
    }
    res.json({
        success: true,
        data: { trainer }
    });
});
// Get all specializations
exports.getSpecializations = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const specializations = await Trainer_model_1.Specialization.findActiveSpecializations();
    res.json({
        success: true,
        data: { specializations }
    });
});
// Create specialization (Admin only)
exports.createSpecialization = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { name, description } = req.body;
    // Check if specialization already exists
    const existing = await Trainer_model_1.Specialization.findByName(name);
    if (existing) {
        throw error_middleware_1.createError.conflict('Specialization with this name already exists');
    }
    const specialization = await Trainer_model_1.Specialization.create({
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
exports.updateSpecialization = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const specialization = await Trainer_model_1.Specialization.findByPk(parseInt(id));
    if (!specialization) {
        throw error_middleware_1.createError.notFound('Specialization not found');
    }
    // Check for name conflicts if name is being changed
    if (name && name !== specialization.name) {
        const existing = await Trainer_model_1.Specialization.findByName(name);
        if (existing) {
            throw error_middleware_1.createError.conflict('Specialization with this name already exists');
        }
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    if (status !== undefined)
        updateData.status = status;
    await specialization.update(updateData);
    res.json({
        success: true,
        message: 'Specialization updated successfully',
        data: { specialization }
    });
});
exports.getMyMembers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const trainer = await Trainer_model_1.Trainer.findOne({ where: { userId: user.id }, raw: true });
    if (!trainer)
        throw error_middleware_1.createError.forbidden('No trainer profile for this user');
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    const count = await Member_model_1.Member.count({ where: { assignedTrainerId: trainer.id } });
    const members = await Member_model_1.Member.findAll({
        where: { assignedTrainerId: trainer.id },
        include: [
            { association: 'user', attributes: ['id', 'email'], include: [{ association: 'profile', attributes: ['fullName', 'avatarUrl'] }] },
        ],
        limit: parseInt(String(limit), 10),
        offset,
        order: [['created_at', 'DESC']],
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
exports.getMyMemberSessions = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const trainer = await Trainer_model_1.Trainer.findOne({ where: { userId: user.id }, raw: true });
    if (!trainer)
        throw error_middleware_1.createError.forbidden('No trainer profile for this user');
    const { status, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    const sequelize = require('@/config/database.config').default;
    const where = `WHERE ts.trainer_id = ${trainer.id}`;
    const conds = [];
    if (status)
        conds.push(`sm.attendance_status = '${String(status).replace(/'/g, "''")}'`);
    const whereSql = conds.length > 0 ? `${where} AND ${conds.join(' AND ')}` : where;
    const [countRows] = await sequelize.query(`SELECT COUNT(*) AS cnt FROM schedule_members sm
     INNER JOIN training_schedules ts ON sm.schedule_id = ts.id
     ${whereSql}`);
    const total = Number(countRows[0]?.cnt || 0);
    const [rows] = await sequelize.query(`SELECT
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
     LIMIT ${parseInt(String(limit), 10)} OFFSET ${offset}`);
    const sessions = rows.map((r) => ({
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
exports.getMyDashboard = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const trainer = await Trainer_model_1.Trainer.findOne({ where: { userId: user.id }, raw: true });
    if (!trainer)
        throw error_middleware_1.createError.forbidden('No trainer profile for this user');
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
    const [totalMembers, activeMembers, sessionsToday, sessionsThisWeek, monthlyIncome, completedCount, cancelledCount,] = await Promise.all([
        Member_model_1.Member.count({ where: { assignedTrainerId: trainer.id } }),
        Member_model_1.Member.count({ where: { assignedTrainerId: trainer.id, membershipStatus: 'ACTIVE' } }),
        Schedule_model_1.TrainingSchedule.count({ where: { trainerId: trainer.id, startDate: todayStr } }),
        Schedule_model_1.TrainingSchedule.count({
            where: {
                trainerId: trainer.id,
                startDate: { [sequelize_1.Op.gte]: startOfWeek.toISOString().split('T')[0], [sequelize_1.Op.lt]: endOfWeek.toISOString().split('T')[0] },
            },
        }),
        Schedule_model_1.TrainingSchedule.sum('pricePerSession', {
            where: {
                trainerId: trainer.id,
                status: 'COMPLETED',
                startDate: { [sequelize_1.Op.gte]: startOfMonth.toISOString().split('T')[0] },
            },
        }),
        Schedule_model_1.TrainingSchedule.count({
            where: {
                trainerId: trainer.id,
                status: 'COMPLETED',
                startDate: { [sequelize_1.Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] },
            },
        }),
        Schedule_model_1.TrainingSchedule.count({
            where: {
                trainerId: trainer.id,
                status: 'CANCELLED',
                startDate: { [sequelize_1.Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] },
            },
        }),
    ]);
    const totalDecisions = completedCount + cancelledCount;
    const completionRate = totalDecisions === 0 ? 0 : Math.round((completedCount / totalDecisions) * 100);
    const todayScheduleRows = await Schedule_model_1.TrainingSchedule.findAll({
        where: { trainerId: trainer.id, startDate: todayStr },
        order: [['startTime', 'ASC']],
        raw: true,
    });
    const todaySchedule = todayScheduleRows.map((s) => ({
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
exports.default = {
    getTrainers: exports.getTrainers,
    getActiveTrainers: exports.getActiveTrainers,
    getTrainerById: exports.getTrainerById,
    getTrainerByCode: exports.getTrainerByCode,
    createTrainer: exports.createTrainer,
    updateTrainer: exports.updateTrainer,
    deleteTrainer: exports.deleteTrainer,
    getTrainerStatistics: exports.getTrainerStatistics,
    getTrainerMembers: exports.getTrainerMembers,
    getCurrentTrainer: exports.getCurrentTrainer,
    getMyDashboard: exports.getMyDashboard,
    getMyMembers: exports.getMyMembers,
    getMyMemberSessions: exports.getMyMemberSessions,
    getSpecializations: exports.getSpecializations,
    createSpecialization: exports.createSpecialization,
    updateSpecialization: exports.updateSpecialization
};
//# sourceMappingURL=trainer.controller.js.map