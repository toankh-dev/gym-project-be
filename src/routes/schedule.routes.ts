import { Router } from 'express';
import {
  createTrainingSchedule,
  getTrainingSchedules,
  getTrainingScheduleById,
  updateTrainingSchedule,
  cancelTrainingSchedule,
  registerForSchedule,
  cancelScheduleRegistration,
  checkInMember,
  checkOutMember,
  getAttendanceLogs,
  getTodayAttendance,
  getAttendanceStatistics,
  getSchedulesByDate,
  getUpcomingSchedules,
  getTrainerSchedules
} from '../controllers/schedule.controller';
// import { // authenticate, // requireRole } from '../middlewares/auth.middleware';
// import { // validateRequest } from '../middlewares/validation.middleware';
import {
  createTrainingScheduleSchema,
  updateTrainingScheduleSchema,
  registerForScheduleSchema,
  checkInMemberSchema,
  checkOutMemberSchema,
  getSchedulesSchema,
  getAttendanceLogsSchema,
  getAttendanceStatsSchema
} from '../validations/schedule.validation';

const router = Router();

// Training Schedule Routes
router.post(
  '/training-schedules',
  // // authenticate,
  // // requireRole(['ADMIN', 'TRAINER']),
  // // validateRequest(createTrainingScheduleSchema),
  createTrainingSchedule
);

router.get(
  '/training-schedules',
  // authenticate,
  // validateRequest(getSchedulesSchema, 'query'),
  getTrainingSchedules
);

router.get(
  '/training-schedules/upcoming',
  // authenticate,
  getUpcomingSchedules
);

router.get(
  '/training-schedules/date/:date',
  // authenticate,
  getSchedulesByDate
);

router.get(
  '/training-schedules/trainer/:trainerId',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  getTrainerSchedules
);

router.get(
  '/training-schedules/:id',
  // authenticate,
  getTrainingScheduleById
);

router.put(
  '/training-schedules/:id',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  // validateRequest(updateTrainingScheduleSchema),
  updateTrainingSchedule
);

router.delete(
  '/training-schedules/:id',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  cancelTrainingSchedule
);

// Member Registration Routes
router.post(
  '/training-schedules/:scheduleId/register',
  // authenticate,
  // validateRequest(registerForScheduleSchema),
  registerForSchedule
);

router.delete(
  '/training-schedules/:scheduleId/members/:memberId',
  // authenticate,
  // requireRole(['ADMIN', 'MEMBER', 'TRAINER']),
  cancelScheduleRegistration
);

// Attendance Routes
router.post(
  '/attendance/check-in',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  // validateRequest(checkInMemberSchema),
  checkInMember
);

router.put(
  '/attendance/check-out/:memberId',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  // validateRequest(checkOutMemberSchema),
  checkOutMember
);

router.get(
  '/attendance/logs',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  // validateRequest(getAttendanceLogsSchema, 'query'),
  getAttendanceLogs
);

router.get(
  '/attendance/today',
  // authenticate,
  // requireRole(['ADMIN', 'TRAINER']),
  getTodayAttendance
);

router.get(
  '/attendance/statistics',
  // authenticate,
  // requireRole(['ADMIN']),
  // validateRequest(getAttendanceStatsSchema, 'query'),
  getAttendanceStatistics
);

export default router;