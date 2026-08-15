import { Router } from 'express';
import { getExercises } from '@/controllers/exercise.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getExercises);
export default router;
