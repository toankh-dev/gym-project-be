import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import memberRoutes from './member.routes';
import trainerRoutes from './trainer.routes';
import packageRoutes from './package.routes';
import subscriptionRoutes from './subscription.routes';
import scheduleRoutes from './schedule.routes';
import paymentRoutes from './payment.routes';
import workoutRoutes from './workout.routes';
import progressRoutes from './progress.routes';
import analyticsRoutes from './analytics.routes';
import uploadRoutes from './upload.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import exerciseRoutes from './exercise.routes';
import workoutPlanRoutes from './workoutPlan.routes';

const router = Router();

// API versioning - all routes are under /api
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/members', memberRoutes);
router.use('/trainers', trainerRoutes);
router.use('/packages', packageRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/payments', paymentRoutes);
router.use('/workouts', workoutRoutes);
router.use('/progress', progressRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/uploads', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workout-plans', workoutPlanRoutes);

// API documentation endpoint
router.get('/', (_, res) => {
  res.json({
    success: true,
    message: 'Gym Management System API',
    version: '1.0.0',
    endpoints: {
      authentication: '/auth',
      users: '/users',
      members: '/members',
      trainers: '/trainers',
      packages: '/packages',
      subscriptions: '/subscriptions',
      schedules: '/schedules',
      payments: '/payments',
      workouts: '/workouts',
      progress: '/progress',
      analytics: '/analytics',
      uploads: '/uploads',
      dashboard: '/dashboard',
      reports: '/reports',
      exercises: '/exercises',
      'workout-plans': '/workout-plans'
    },
    documentation: process.env.NODE_ENV === 'development' ? '/api/docs' : undefined,
    health: '/api/health'
  });
});

export default router;