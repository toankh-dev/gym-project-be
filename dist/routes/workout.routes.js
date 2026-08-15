"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const error_middleware_1 = require("@/middlewares/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
const getWorkouts = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        data: { workouts: [] }
    });
});
router.get('/', getWorkouts);
exports.default = router;
//# sourceMappingURL=workout.routes.js.map