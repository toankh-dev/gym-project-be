"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const progress_controller_1 = require("@/controllers/progress.controller");
const progress_validator_1 = require("@/validators/progress.validator");
const router = (0, express_1.Router)();
const progressController = new progress_controller_1.ProgressController();
router.use(auth_middleware_1.authenticate);
// Member progress routes
router.get('/members/:memberId', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), progressController.getMemberProgress);
router.get('/members/:memberId/statistics', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), progressController.getProgressStatistics);
router.get('/members/:memberId/workouts', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), progressController.getWorkoutProgress);
router.post('/members/:memberId/entries', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), progress_validator_1.validateProgressUpdate, progressController.createProgressEntry);
router.put('/members/:memberId/profile', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), progress_validator_1.validateProgressUpdate, progressController.updateMemberProfile);
// Current member (self) progress routes
router.get('/my/current', (0, auth_middleware_1.authorize)('MEMBER'), progressController.getCurrentMemberProgress);
router.put('/my/profile', (0, auth_middleware_1.authorize)('MEMBER'), progress_validator_1.validateProgressUpdate, progressController.updateCurrentMemberProfile);
router.post('/my/workout-logs', (0, auth_middleware_1.authorize)('MEMBER'), progress_validator_1.validateWorkoutLog, progressController.createWorkoutLog);
exports.default = router;
//# sourceMappingURL=progress.routes.js.map