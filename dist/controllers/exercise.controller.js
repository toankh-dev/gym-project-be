"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExercises = void 0;
const sequelize_1 = require("sequelize");
const Exercise_model_1 = require("@/models/Exercise.model");
const error_middleware_1 = require("@/middlewares/error.middleware");
exports.getExercises = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { search, category, muscleGroup, limit = 100 } = req.query;
    const where = {};
    if (search)
        where.name = { [sequelize_1.Op.like]: `%${search}%` };
    if (category)
        where.category = category;
    if (muscleGroup)
        where.muscleGroup = muscleGroup;
    const exercises = await Exercise_model_1.Exercise.findAll({
        where,
        limit: Math.min(500, parseInt(String(limit), 10)),
        order: [['name', 'ASC']],
    });
    res.json({ success: true, data: { exercises } });
});
//# sourceMappingURL=exercise.controller.js.map