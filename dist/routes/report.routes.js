"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("@/controllers/report.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)('ADMIN', 'STAFF'));
router.get('/revenue', report_controller_1.getRevenueReport);
router.get('/membership', report_controller_1.getMembershipReport);
router.get('/attendance', report_controller_1.getAttendanceReport);
router.get('/trainer-performance', report_controller_1.getTrainerPerformanceReport);
router.get('/schedule-analytics', report_controller_1.getScheduleAnalyticsReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map