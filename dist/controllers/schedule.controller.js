"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrainerSchedules = exports.getUpcomingSchedules = exports.getSchedulesByDate = exports.getAttendanceStatistics = exports.getTodayAttendance = exports.getAttendanceLogs = exports.checkOutMember = exports.checkInMember = exports.cancelScheduleRegistration = exports.registerForSchedule = exports.cancelTrainingSchedule = exports.updateTrainingSchedule = exports.getTrainingScheduleById = exports.getTrainingSchedules = exports.createTrainingSchedule = void 0;
const Schedule_model_1 = require("../models/Schedule.model");
const Trainer_model_1 = require("../models/Trainer.model");
const Member_model_1 = require("../models/Member.model");
const error_middleware_1 = require("../middlewares/error.middleware");
const sequelize_1 = require("sequelize");
// Training Schedule Controllers
const createTrainingSchedule = async (req, res) => {
    try {
        const { className, trainerId, startDate, endDate, startTime, endTime, dayOfWeek, location, maxCapacity, classType, description } = req.body;
        // Validate trainer exists and is active
        const trainer = await Trainer_model_1.Trainer.findByPk(trainerId);
        if (!trainer || trainer.status !== 'ACTIVE') {
            throw new error_middleware_1.CustomError(400, 'Trainer not found or inactive');
        }
        // Check for schedule conflicts
        const conflictingSchedule = await Schedule_model_1.TrainingSchedule.findOne({
            where: {
                trainerId,
                startDate,
                status: 'SCHEDULED',
                [sequelize_1.Op.or]: [
                    {
                        startTime: {
                            [sequelize_1.Op.between]: [startTime, endTime]
                        }
                    },
                    {
                        endTime: {
                            [sequelize_1.Op.between]: [startTime, endTime]
                        }
                    },
                    {
                        [sequelize_1.Op.and]: [
                            { startTime: { [sequelize_1.Op.lte]: startTime } },
                            { endTime: { [sequelize_1.Op.gte]: endTime } }
                        ]
                    }
                ]
            }
        });
        if (conflictingSchedule) {
            throw new error_middleware_1.CustomError(400, 'Trainer has conflicting schedule at this time');
        }
        // Create training schedule
        const schedule = await Schedule_model_1.TrainingSchedule.create({
            className,
            trainerId,
            startDate,
            endDate,
            startTime,
            endTime,
            dayOfWeek,
            location,
            maxCapacity: maxCapacity || 1,
            classType: classType || 'PERSONAL_TRAINING',
            description
        });
        // Include trainer information in response
        const scheduleWithTrainer = await Schedule_model_1.TrainingSchedule.findByPk(schedule.id, {
            include: [
                {
                    association: 'trainer',
                    include: [
                        {
                            association: 'user',
                            include: [{ association: 'profile' }]
                        }
                    ]
                }
            ]
        });
        res.status(201).json({
            success: true,
            message: 'Training schedule created successfully',
            data: { schedule: scheduleWithTrainer }
        });
    }
    catch (error) {
        console.error('Create training schedule error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to create training schedule',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.createTrainingSchedule = createTrainingSchedule;
const getTrainingSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, trainerId, date, startDate, endDate, status, classType } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const whereClause = {};
        // Apply filters
        if (trainerId)
            whereClause.trainerId = trainerId;
        if (status)
            whereClause.status = status;
        if (classType)
            whereClause.classType = classType;
        // Date filtering
        if (date) {
            whereClause.startDate = date;
        }
        else if (startDate && endDate) {
            whereClause.startDate = {
                [sequelize_1.Op.between]: [startDate, endDate]
            };
        }
        const { count, rows: schedules } = await Schedule_model_1.TrainingSchedule.findAndCountAll({
            where: whereClause,
            include: [
                {
                    association: 'trainer',
                    include: [
                        {
                            association: 'user',
                            include: [{ association: 'profile' }]
                        }
                    ]
                }
                // Temporarily commented out to test basic query
                // {
                //   association: 'registeredMembers',
                //   include: [
                //     {
                //       association: 'member',
                //       include: [
                //         {
                //           association: 'user',
                //           include: [{ association: 'profile' }]
                //         }
                //       ]
                //     }
                //   ]
                // }
            ],
            order: [['startDate', 'ASC'], ['startTime', 'ASC']],
            limit: Number(limit),
            offset
        });
        res.json({
            success: true,
            data: {
                schedules,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(count / Number(limit)),
                    totalItems: count,
                    limit: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get training schedules error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get training schedules',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getTrainingSchedules = getTrainingSchedules;
const getTrainingScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule_model_1.TrainingSchedule.findByPk(id, {
            include: [
                {
                    association: 'trainer',
                    include: [
                        {
                            association: 'user',
                            include: [{ association: 'profile' }]
                        }
                    ]
                },
                {
                    association: 'registeredMembers',
                    include: [
                        {
                            association: 'member',
                            include: [
                                {
                                    association: 'user',
                                    include: [{ association: 'profile' }]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        if (!schedule) {
            throw new error_middleware_1.CustomError(404, 'Training schedule not found');
        }
        res.json({
            success: true,
            data: { schedule }
        });
    }
    catch (error) {
        console.error('Get training schedule error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get training schedule',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getTrainingScheduleById = getTrainingScheduleById;
const updateTrainingSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const schedule = await Schedule_model_1.TrainingSchedule.findByPk(id);
        if (!schedule) {
            throw new error_middleware_1.CustomError(404, 'Training schedule not found');
        }
        // Check if schedule is in past
        if (schedule.isInPast()) {
            throw new error_middleware_1.CustomError(400, 'Cannot update past training schedule');
        }
        // If updating trainer, validate new trainer
        if (updateData.trainerId && updateData.trainerId !== schedule.trainerId) {
            const trainer = await Trainer_model_1.Trainer.findByPk(updateData.trainerId);
            if (!trainer || trainer.status !== 'ACTIVE') {
                throw new error_middleware_1.CustomError(400, 'Trainer not found or inactive');
            }
        }
        // Update schedule
        await schedule.update(updateData);
        // Fetch updated schedule with associations
        const updatedSchedule = await Schedule_model_1.TrainingSchedule.findByPk(id, {
            include: [
                {
                    association: 'trainer',
                    include: [
                        {
                            association: 'user',
                            include: [{ association: 'profile' }]
                        }
                    ]
                },
                {
                    association: 'registeredMembers',
                    include: [
                        {
                            association: 'member',
                            include: [
                                {
                                    association: 'user',
                                    include: [{ association: 'profile' }]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        res.json({
            success: true,
            message: 'Training schedule updated successfully',
            data: { schedule: updatedSchedule }
        });
    }
    catch (error) {
        console.error('Update training schedule error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to update training schedule',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.updateTrainingSchedule = updateTrainingSchedule;
const cancelTrainingSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule_model_1.TrainingSchedule.findByPk(id);
        if (!schedule) {
            throw new error_middleware_1.CustomError(404, 'Training schedule not found');
        }
        if (schedule.status === 'CANCELLED') {
            throw new error_middleware_1.CustomError(400, 'Training schedule already cancelled');
        }
        if (schedule.status === 'COMPLETED') {
            throw new error_middleware_1.CustomError(400, 'Cannot cancel completed training schedule');
        }
        // Cancel schedule
        await schedule.update({ status: 'CANCELLED' });
        // Cancel all member registrations
        await Schedule_model_1.ScheduleMember.update({ status: 'CANCELLED' }, {
            where: {
                scheduleId: id,
                status: 'REGISTERED'
            }
        });
        res.json({
            success: true,
            message: 'Training schedule cancelled successfully',
            data: { schedule }
        });
    }
    catch (error) {
        console.error('Cancel training schedule error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to cancel training schedule',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.cancelTrainingSchedule = cancelTrainingSchedule;
// Member Registration Controllers
const registerForSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { memberId } = req.body;
        // Validate schedule exists and is bookable
        const schedule = await Schedule_model_1.TrainingSchedule.findByPk(scheduleId, {
            include: [{ association: 'registeredMembers' }]
        });
        if (!schedule) {
            throw new error_middleware_1.CustomError(404, 'Training schedule not found');
        }
        if (!schedule.canBook()) {
            throw new error_middleware_1.CustomError(400, 'Training schedule is not available for booking');
        }
        // Validate member exists
        const member = await Member_model_1.Member.findByPk(memberId);
        if (!member || member.membershipStatus !== 'ACTIVE') {
            throw new error_middleware_1.CustomError(400, 'Member not found or inactive');
        }
        // Check if already registered
        const existingRegistration = await Schedule_model_1.ScheduleMember.findOne({
            where: {
                scheduleId,
                memberId,
                status: {
                    [sequelize_1.Op.in]: ['REGISTERED', 'ATTENDED']
                }
            }
        });
        if (existingRegistration) {
            throw new error_middleware_1.CustomError(400, 'Member already registered for this schedule');
        }
        // Register member
        const registration = await Schedule_model_1.ScheduleMember.create({
            scheduleId,
            memberId
        });
        res.status(201).json({
            success: true,
            message: 'Successfully registered for training schedule',
            data: { registration }
        });
    }
    catch (error) {
        console.error('Register for schedule error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to register for training schedule',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.registerForSchedule = registerForSchedule;
const cancelScheduleRegistration = async (req, res) => {
    try {
        const { scheduleId, memberId } = req.params;
        const registration = await Schedule_model_1.ScheduleMember.findOne({
            where: {
                scheduleId,
                memberId,
                status: 'REGISTERED'
            }
        });
        if (!registration) {
            throw new error_middleware_1.CustomError(404, 'Registration not found');
        }
        // Update status to cancelled
        await registration.update({ status: 'CANCELLED' });
        res.json({
            success: true,
            message: 'Registration cancelled successfully',
            data: { registration }
        });
    }
    catch (error) {
        console.error('Cancel registration error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to cancel registration',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.cancelScheduleRegistration = cancelScheduleRegistration;
// Attendance Controllers
const checkInMember = async (req, res) => {
    try {
        const { memberId, scheduleId, attendanceType = 'GYM_VISIT' } = req.body;
        // Validate member exists
        const member = await Member_model_1.Member.findByPk(memberId);
        if (!member) {
            throw new error_middleware_1.CustomError(404, 'Member not found');
        }
        // Check if already checked in
        const existingCheckin = await Schedule_model_1.AttendanceLog.findOne({
            where: {
                memberId,
                status: 'CHECKED_IN',
                checkinTime: {
                    [sequelize_1.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });
        if (existingCheckin) {
            throw new error_middleware_1.CustomError(400, 'Member already checked in today');
        }
        // Create attendance log
        const attendance = await Schedule_model_1.AttendanceLog.create({
            memberId,
            scheduleId,
            attendanceType,
            checkinTime: new Date()
        });
        // If this is for a specific schedule, update member registration status
        if (scheduleId) {
            await Schedule_model_1.ScheduleMember.update({ status: 'ATTENDED' }, {
                where: {
                    scheduleId,
                    memberId,
                    status: 'REGISTERED'
                }
            });
        }
        res.status(201).json({
            success: true,
            message: 'Member checked in successfully',
            data: { attendance }
        });
    }
    catch (error) {
        console.error('Check in member error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to check in member',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.checkInMember = checkInMember;
const checkOutMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { note } = req.body;
        // Find active check-in
        const attendance = await Schedule_model_1.AttendanceLog.findOne({
            where: {
                memberId,
                status: 'CHECKED_IN'
            },
            order: [['checkinTime', 'DESC']]
        });
        if (!attendance) {
            throw new error_middleware_1.CustomError(404, 'No active check-in found for member');
        }
        // Update attendance log
        await attendance.update({
            status: 'CHECKED_OUT',
            checkoutTime: new Date(),
            note
        });
        res.json({
            success: true,
            message: 'Member checked out successfully',
            data: { attendance }
        });
    }
    catch (error) {
        console.error('Check out member error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to check out member',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.checkOutMember = checkOutMember;
const getAttendanceLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, memberId, startDate, endDate, attendanceType, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const whereClause = {};
        // Apply filters
        if (memberId)
            whereClause.memberId = memberId;
        if (attendanceType)
            whereClause.attendanceType = attendanceType;
        if (status)
            whereClause.status = status;
        // Date filtering
        if (startDate && endDate) {
            whereClause.checkinTime = {
                [sequelize_1.Op.between]: [startDate, endDate]
            };
        }
        const { count, rows: attendanceLogs } = await Schedule_model_1.AttendanceLog.findAndCountAll({
            where: whereClause,
            include: [
                {
                    association: 'member',
                    include: [
                        {
                            association: 'user',
                            include: [{ association: 'profile' }]
                        }
                    ]
                },
                {
                    association: 'schedule',
                    include: [
                        {
                            association: 'trainer',
                            include: [
                                {
                                    association: 'user',
                                    include: [{ association: 'profile' }]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['checkinTime', 'DESC']],
            limit: Number(limit),
            offset
        });
        res.json({
            success: true,
            data: {
                attendanceLogs,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(count / Number(limit)),
                    totalItems: count,
                    limit: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get attendance logs error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get attendance logs',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getAttendanceLogs = getAttendanceLogs;
const getTodayAttendance = async (req, res) => {
    try {
        const attendanceLogs = await Schedule_model_1.AttendanceLog.getTodayAttendance();
        res.json({
            success: true,
            data: { attendanceLogs }
        });
    }
    catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get today attendance',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getTodayAttendance = getTodayAttendance;
const getAttendanceStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            throw new error_middleware_1.CustomError(400, 'Start date and end date are required');
        }
        const stats = await Schedule_model_1.AttendanceLog.getAttendanceStats(new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: { statistics: stats }
        });
    }
    catch (error) {
        console.error('Get attendance statistics error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get attendance statistics',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getAttendanceStatistics = getAttendanceStatistics;
// Dashboard/Analytics Controllers
const getSchedulesByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const schedules = await Schedule_model_1.TrainingSchedule.findByDate(new Date(date));
        res.json({
            success: true,
            data: { schedules }
        });
    }
    catch (error) {
        console.error('Get schedules by date error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get schedules by date',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getSchedulesByDate = getSchedulesByDate;
const getUpcomingSchedules = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const schedules = await Schedule_model_1.TrainingSchedule.getUpcomingSchedules(Number(limit));
        res.json({
            success: true,
            data: { schedules }
        });
    }
    catch (error) {
        console.error('Get upcoming schedules error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get upcoming schedules',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getUpcomingSchedules = getUpcomingSchedules;
const getTrainerSchedules = async (req, res) => {
    try {
        const { trainerId } = req.params;
        const { startDate, endDate } = req.query;
        const schedules = await Schedule_model_1.TrainingSchedule.findByTrainer(Number(trainerId), startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({
            success: true,
            data: { schedules }
        });
    }
    catch (error) {
        console.error('Get trainer schedules error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to get trainer schedules',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }
};
exports.getTrainerSchedules = getTrainerSchedules;
//# sourceMappingURL=schedule.controller.js.map