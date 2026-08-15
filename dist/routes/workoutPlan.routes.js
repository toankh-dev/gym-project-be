"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workoutPlan_controller_1 = require("@/controllers/workoutPlan.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)('TRAINER'));
router.get('/', workoutPlan_controller_1.listWorkoutPlans);
router.get('/:id', workoutPlan_controller_1.getWorkoutPlanById);
router.post('/', workoutPlan_controller_1.createWorkoutPlan);
router.put('/:id', workoutPlan_controller_1.updateWorkoutPlan);
router.delete('/:id', workoutPlan_controller_1.deleteWorkoutPlan);
exports.default = router;
//# sourceMappingURL=workoutPlan.routes.js.map