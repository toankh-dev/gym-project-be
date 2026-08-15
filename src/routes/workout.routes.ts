import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';

const router = Router();

router.use(authenticate);

const getWorkouts = asyncHandler(async (req: any, res: any): Promise<void> => {
  res.json({
    success: true,
    data: { workouts: [] }
  });
});

router.get('/', getWorkouts);

export default router;