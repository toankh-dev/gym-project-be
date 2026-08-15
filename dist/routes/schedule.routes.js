"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedule_controller_1 = require("../controllers/schedule.controller");
const router = (0, express_1.Router)();
// Training Schedule Routes
router.post('/training-schedules', 
// // authenticate,
// // requireRole(['ADMIN', 'TRAINER']),
// // validateRequest(createTrainingScheduleSchema),
schedule_controller_1.createTrainingSchedule);
router.get('/training-schedules', 
// authenticate,
// validateRequest(getSchedulesSchema, 'query'),
schedule_controller_1.getTrainingSchedules);
router.get('/training-schedules/upcoming', 
// authenticate,
schedule_controller_1.getUpcomingSchedules);
router.get('/training-schedules/date/:date', 
// authenticate,
schedule_controller_1.getSchedulesByDate);
router.get('/training-schedules/trainer/:trainerId', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
schedule_controller_1.getTrainerSchedules);
router.get('/training-schedules/:id', 
// authenticate,
schedule_controller_1.getTrainingScheduleById);
router.put('/training-schedules/:id', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
// validateRequest(updateTrainingScheduleSchema),
schedule_controller_1.updateTrainingSchedule);
router.delete('/training-schedules/:id', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
schedule_controller_1.cancelTrainingSchedule);
// Member Registration Routes
router.post('/training-schedules/:scheduleId/register', 
// authenticate,
// validateRequest(registerForScheduleSchema),
schedule_controller_1.registerForSchedule);
router.delete('/training-schedules/:scheduleId/members/:memberId', 
// authenticate,
// requireRole(['ADMIN', 'MEMBER', 'TRAINER']),
schedule_controller_1.cancelScheduleRegistration);
// Attendance Routes
router.post('/attendance/check-in', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
// validateRequest(checkInMemberSchema),
schedule_controller_1.checkInMember);
router.put('/attendance/check-out/:memberId', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
// validateRequest(checkOutMemberSchema),
schedule_controller_1.checkOutMember);
router.get('/attendance/logs', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
// validateRequest(getAttendanceLogsSchema, 'query'),
schedule_controller_1.getAttendanceLogs);
router.get('/attendance/today', 
// authenticate,
// requireRole(['ADMIN', 'TRAINER']),
schedule_controller_1.getTodayAttendance);
router.get('/attendance/statistics', 
// authenticate,
// requireRole(['ADMIN']),
// validateRequest(getAttendanceStatsSchema, 'query'),
schedule_controller_1.getAttendanceStatistics);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map