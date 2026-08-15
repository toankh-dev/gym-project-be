import { Router } from 'express';
import {
  getRevenueReport,
  getMembershipReport,
  getAttendanceReport,
  getTrainerPerformanceReport,
  getScheduleAnalyticsReport,
} from '@/controllers/report.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/revenue', getRevenueReport);
router.get('/membership', getMembershipReport);
router.get('/attendance', getAttendanceReport);
router.get('/trainer-performance', getTrainerPerformanceReport);
router.get('/schedule-analytics', getScheduleAnalyticsReport);

export default router;
