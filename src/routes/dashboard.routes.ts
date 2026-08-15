import { Router } from 'express';
import { getDashboard } from '@/controllers/dashboard.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'STAFF'), getDashboard);
export default router;
