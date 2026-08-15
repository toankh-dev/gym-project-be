import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { ProgressController } from '@/controllers/progress.controller';
import { validateProgressUpdate, validateWorkoutLog } from '@/validators/progress.validator';

const router = Router();
const progressController = new ProgressController();

router.use(authenticate);

// Member progress routes
router.get('/members/:memberId', authorize('ADMIN', 'STAFF', 'TRAINER'), progressController.getMemberProgress);
router.get('/members/:memberId/statistics', authorize('ADMIN', 'STAFF', 'TRAINER'), progressController.getProgressStatistics);
router.get('/members/:memberId/workouts', authorize('ADMIN', 'STAFF', 'TRAINER'), progressController.getWorkoutProgress);
router.post('/members/:memberId/entries', authorize('ADMIN', 'STAFF', 'TRAINER'), validateProgressUpdate, progressController.createProgressEntry);
router.put('/members/:memberId/profile', authorize('ADMIN', 'STAFF', 'TRAINER'), validateProgressUpdate, progressController.updateMemberProfile);

// Current member (self) progress routes
router.get('/my/current', authorize('MEMBER'), progressController.getCurrentMemberProgress);
router.put('/my/profile', authorize('MEMBER'), validateProgressUpdate, progressController.updateCurrentMemberProfile);
router.post('/my/workout-logs', authorize('MEMBER'), validateWorkoutLog, progressController.createWorkoutLog);

export default router;