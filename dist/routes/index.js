"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const member_routes_1 = __importDefault(require("./member.routes"));
const trainer_routes_1 = __importDefault(require("./trainer.routes"));
const package_routes_1 = __importDefault(require("./package.routes"));
const subscription_routes_1 = __importDefault(require("./subscription.routes"));
const schedule_routes_1 = __importDefault(require("./schedule.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const workout_routes_1 = __importDefault(require("./workout.routes"));
const progress_routes_1 = __importDefault(require("./progress.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const exercise_routes_1 = __importDefault(require("./exercise.routes"));
const workoutPlan_routes_1 = __importDefault(require("./workoutPlan.routes"));
const router = (0, express_1.Router)();
// API versioning - all routes are under /api
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/members', member_routes_1.default);
router.use('/trainers', trainer_routes_1.default);
router.use('/packages', package_routes_1.default);
router.use('/subscriptions', subscription_routes_1.default);
router.use('/schedules', schedule_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/workouts', workout_routes_1.default);
router.use('/progress', progress_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
router.use('/uploads', upload_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/reports', report_routes_1.default);
router.use('/exercises', exercise_routes_1.default);
router.use('/workout-plans', workoutPlan_routes_1.default);
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
exports.default = router;
//# sourceMappingURL=index.js.map