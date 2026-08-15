"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const error_middleware_1 = require("@/middlewares/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
const getDashboardStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
router.get('/dashboard', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), getDashboardStats);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map