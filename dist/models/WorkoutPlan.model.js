"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutPlanExercise = exports.WorkoutPlan = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
class WorkoutPlan extends sequelize_1.Model {
    id;
    memberId;
    trainerId;
    planName;
    description;
    goal;
    difficultyLevel;
    durationWeeks;
    sessionsPerWeek;
    startDate;
    endDate;
    status;
    notes;
    createdAt;
    updatedAt;
}
exports.WorkoutPlan = WorkoutPlan;
class WorkoutPlanExercise extends sequelize_1.Model {
    id;
    workoutPlanId;
    exerciseId;
    dayOfWeek;
    exerciseOrder;
    sets;
    reps;
    weightKg;
    durationMinutes;
    restSeconds;
    notes;
    createdAt;
    updatedAt;
}
exports.WorkoutPlanExercise = WorkoutPlanExercise;
WorkoutPlan.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    memberId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'member_id' },
    trainerId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'trainer_id' },
    planName: { type: sequelize_1.DataTypes.STRING(150), allowNull: false, field: 'plan_name' },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    goal: {
        type: sequelize_1.DataTypes.ENUM('WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'GENERAL_FITNESS', 'REHABILITATION'),
        allowNull: false,
    },
    difficultyLevel: {
        type: sequelize_1.DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
        allowNull: false,
        field: 'difficulty_level',
    },
    durationWeeks: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, field: 'duration_weeks' },
    sessionsPerWeek: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, field: 'sessions_per_week' },
    startDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
    endDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true, field: 'end_date' },
    status: {
        type: sequelize_1.DataTypes.ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'),
        defaultValue: 'DRAFT',
        allowNull: false,
    },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
}, {
    sequelize: database_config_1.default,
    modelName: 'WorkoutPlan',
    tableName: 'workout_plans',
    timestamps: true,
    underscored: true,
    paranoid: false,
});
WorkoutPlanExercise.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    workoutPlanId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'workout_plan_id' },
    exerciseId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'exercise_id' },
    dayOfWeek: {
        type: sequelize_1.DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
        allowNull: false,
        field: 'day_of_week',
    },
    exerciseOrder: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 1, allowNull: false, field: 'exercise_order' },
    sets: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    reps: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    weightKg: { type: sequelize_1.DataTypes.DECIMAL(6, 2), allowNull: true, field: 'weight_kg' },
    durationMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, field: 'duration_minutes' },
    restSeconds: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, field: 'rest_seconds' },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
}, {
    sequelize: database_config_1.default,
    modelName: 'WorkoutPlanExercise',
    tableName: 'workout_plan_exercises',
    timestamps: true,
    underscored: true,
    paranoid: false,
});
//# sourceMappingURL=WorkoutPlan.model.js.map