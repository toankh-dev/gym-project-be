import { Request, Response } from 'express';
import { TrainingSchedule, ScheduleMember, AttendanceLog } from '../models/Schedule.model';
import { Trainer } from '../models/Trainer.model';
import { Member } from '../models/Member.model';
import { CustomError } from '../middlewares/error.middleware';
import { Op } from 'sequelize';

// Training Schedule Controllers
export const createTrainingSchedule = async (req: Request, res: Response) => {
  try {
    const {
      className,
      trainerId,
      startDate,
      endDate,
      startTime,
      endTime,
      dayOfWeek,
      location,
      maxCapacity,
      classType,
      description
    } = req.body;

    // Validate trainer exists and is active
    const trainer = await Trainer.findByPk(trainerId);
    if (!trainer || trainer.status !== 'ACTIVE') {
      throw new CustomError('Trainer not found or inactive', 400);
    }

    // Check for schedule conflicts
    const conflictingSchedule = await TrainingSchedule.findOne({
      where: {
        trainerId,
        startDate,
        status: 'SCHEDULED',
        [Op.or]: [
          {
            startTime: {
              [Op.between]: [startTime, endTime]
            }
          },
          {
            endTime: {
              [Op.between]: [startTime, endTime]
            }
          },
          {
            [Op.and]: [
              { startTime: { [Op.lte]: startTime } },
              { endTime: { [Op.gte]: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingSchedule) {
      throw new CustomError('Trainer has conflicting schedule at this time', 400);
    }

    // Create training schedule
    const schedule = await TrainingSchedule.create({
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
    const scheduleWithTrainer = await TrainingSchedule.findByPk(schedule.id, {
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
  } catch (error: any) {
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

export const getTrainingSchedules = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      trainerId,
      date,
      startDate,
      endDate,
      status,
      classType
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereClause: any = {};

    // Apply filters
    if (trainerId) whereClause.trainerId = trainerId;
    if (status) whereClause.status = status;
    if (classType) whereClause.classType = classType;

    // Date filtering
    if (date) {
      whereClause.startDate = date;
    } else if (startDate && endDate) {
      whereClause.startDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows: schedules } = await TrainingSchedule.findAndCountAll({
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
  } catch (error: any) {
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

export const getTrainingScheduleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schedule = await TrainingSchedule.findByPk(id, {
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
      throw new CustomError('Training schedule not found', 404);
    }

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error: any) {
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

export const updateTrainingSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const schedule = await TrainingSchedule.findByPk(id);
    if (!schedule) {
      throw new CustomError('Training schedule not found', 404);
    }

    // Check if schedule is in past
    if (schedule.isInPast()) {
      throw new CustomError('Cannot update past training schedule', 400);
    }

    // If updating trainer, validate new trainer
    if (updateData.trainerId && updateData.trainerId !== schedule.trainerId) {
      const trainer = await Trainer.findByPk(updateData.trainerId);
      if (!trainer || trainer.status !== 'ACTIVE') {
        throw new CustomError('Trainer not found or inactive', 400);
      }
    }

    // Update schedule
    await schedule.update(updateData);

    // Fetch updated schedule with associations
    const updatedSchedule = await TrainingSchedule.findByPk(id, {
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
  } catch (error: any) {
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

export const cancelTrainingSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schedule = await TrainingSchedule.findByPk(id);
    if (!schedule) {
      throw new CustomError('Training schedule not found', 404);
    }

    if (schedule.status === 'CANCELLED') {
      throw new CustomError('Training schedule already cancelled', 400);
    }

    if (schedule.status === 'COMPLETED') {
      throw new CustomError('Cannot cancel completed training schedule', 400);
    }

    // Cancel schedule
    await schedule.update({ status: 'CANCELLED' });

    // Cancel all member registrations
    await ScheduleMember.update(
      { status: 'CANCELLED' },
      {
        where: {
          scheduleId: id,
          status: 'REGISTERED'
        }
      }
    );

    res.json({
      success: true,
      message: 'Training schedule cancelled successfully',
      data: { schedule }
    });
  } catch (error: any) {
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

// Member Registration Controllers
export const registerForSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    const { memberId } = req.body;

    // Validate schedule exists and is bookable
    const schedule = await TrainingSchedule.findByPk(scheduleId, {
      include: [{ association: 'registeredMembers' }]
    });

    if (!schedule) {
      throw new CustomError('Training schedule not found', 404);
    }

    if (!schedule.canBook()) {
      throw new CustomError('Training schedule is not available for booking', 400);
    }

    // Validate member exists
    const member = await Member.findByPk(memberId);
    if (!member || member.membershipStatus !== 'ACTIVE') {
      throw new CustomError('Member not found or inactive', 400);
    }

    // Check if already registered
    const existingRegistration = await ScheduleMember.findOne({
      where: {
        scheduleId,
        memberId,
        status: {
          [Op.in]: ['REGISTERED', 'ATTENDED']
        }
      }
    });

    if (existingRegistration) {
      throw new CustomError('Member already registered for this schedule', 400);
    }

    // Register member
    const registration = await ScheduleMember.create({
      scheduleId,
      memberId
    });

    // Increment current enrollment
    await schedule.increment('currentEnrollment', { by: 1 });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for training schedule',
      data: { registration }
    });
  } catch (error: any) {
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

export const cancelScheduleRegistration = async (req: Request, res: Response) => {
  try {
    const { scheduleId, memberId } = req.params;

    const registration = await ScheduleMember.findOne({
      where: {
        scheduleId,
        memberId,
        status: 'REGISTERED'
      }
    });

    if (!registration) {
      throw new CustomError('Registration not found', 404);
    }

    // Update status to cancelled
    await registration.update({ status: 'CANCELLED' });

    // Decrement current enrollment
    const schedule = await TrainingSchedule.findByPk(scheduleId);
    if (schedule && schedule.currentEnrollment > 0) {
      await schedule.decrement('currentEnrollment', { by: 1 });
    }

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
      data: { registration }
    });
  } catch (error: any) {
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

// Attendance Controllers
export const checkInMember = async (req: Request, res: Response) => {
  try {
    const { memberId, scheduleId, attendanceType = 'GYM_VISIT' } = req.body;

    // Validate member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new CustomError('Member not found', 404);
    }

    // Check if already checked in
    const existingCheckin = await AttendanceLog.findOne({
      where: {
        memberId,
        ...(scheduleId ? { scheduleId } : {}),
        checkinTime: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    if (existingCheckin) {
      throw new CustomError('Member already checked in today', 400);
    }

    // Create attendance log
    const attendance = await AttendanceLog.create({
      memberId,
      scheduleId,
      attendanceType,
      checkinTime: new Date()
    });

    // If this is for a specific schedule, update member registration status
    if (scheduleId) {
      await ScheduleMember.update(
        { status: 'ATTENDED' },
        {
          where: {
            scheduleId,
            memberId,
            status: 'REGISTERED'
          }
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Member checked in successfully',
      data: { attendance }
    });
  } catch (error: any) {
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

export const checkOutMember = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { note } = req.body;

    // Find active check-in
    const attendance = await AttendanceLog.findOne({
      where: {
        memberId,
        checkoutTime: null
      },
      order: [['checkinTime', 'DESC']]
    });

    if (!attendance) {
      throw new CustomError('No active check-in found for member', 404);
    }

    // Update attendance log
    await attendance.update({
      checkoutTime: new Date()
    });

    res.json({
      success: true,
      message: 'Member checked out successfully',
      data: { attendance }
    });
  } catch (error: any) {
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

export const getAttendanceLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      memberId,
      startDate,
      endDate,
      attendanceType,
      status
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereClause: any = {};

    // Apply filters
    if (memberId) whereClause.memberId = memberId;
    if (attendanceType) whereClause.attendanceType = attendanceType;
    if (status === 'CHECKED_IN') {
      whereClause.checkoutTime = null;
    } else if (status === 'CHECKED_OUT') {
      whereClause.checkoutTime = { [Op.not]: null };
    }

    // Date filtering
    if (startDate && endDate) {
      whereClause.checkinTime = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows: attendanceLogs } = await AttendanceLog.findAndCountAll({
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
  } catch (error: any) {
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

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const attendanceLogs = await AttendanceLog.getTodayAttendance();

    res.json({
      success: true,
      data: { attendanceLogs }
    });
  } catch (error: any) {
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

export const getAttendanceStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new CustomError('Start date and end date are required', 400);
    }

    const stats = await AttendanceLog.getAttendanceStats(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: { statistics: stats }
    });
  } catch (error: any) {
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

// Dashboard/Analytics Controllers
export const getSchedulesByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const schedules = await TrainingSchedule.findByDate(new Date(date));

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error: any) {
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

export const getUpcomingSchedules = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const schedules = await TrainingSchedule.getUpcomingSchedules(Number(limit));

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error: any) {
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

export const getTrainerSchedules = async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.params;
    const { startDate, endDate } = req.query;

    const schedules = await TrainingSchedule.findByTrainer(
      Number(trainerId),
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error: any) {
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