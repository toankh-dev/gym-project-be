import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';

const router = Router();

router.use(authenticate);

const getDashboardStats = asyncHandler(async (req: any, res: any): Promise<void> => {
  // Mock dashboard statistics
  res.json({
    success: true,
    data: {
      statistics: {
        totalMembers: 150,
        activeMembers: 140,
        totalTrainers: 8,
        monthlyRevenue: 25000000,
        todayAttendance: 45,
        pendingPayments: 5,
        revenueChart: [
          { month: '2026-01', revenue: 20000000, newMembers: 15 },
          { month: '2026-02', revenue: 22000000, newMembers: 18 },
          { month: '2026-03', revenue: 25000000, newMembers: 22 }
        ]
      }
    }
  });
});

router.get('/dashboard', authorize('ADMIN', 'STAFF'), getDashboardStats);

export default router;