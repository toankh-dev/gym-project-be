import { Router } from 'express';
import {
  listWorkoutPlans, getWorkoutPlanById, createWorkoutPlan,
  updateWorkoutPlan, deleteWorkoutPlan,
} from '@/controllers/workoutPlan.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(authorize('TRAINER'));

router.get('/', listWorkoutPlans);
router.get('/:id', getWorkoutPlanById);
router.post('/', createWorkoutPlan);
router.put('/:id', updateWorkoutPlan);
router.delete('/:id', deleteWorkoutPlan);

export default router;
