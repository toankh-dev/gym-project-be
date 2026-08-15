"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutProgressLog = exports.Exercise = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// Exercise model
class Exercise extends sequelize_1.Model {
    id;
    name;
    category;
    muscleGroup;
    equipmentNeeded;
    difficultyLevel;
    description;
    instructions;
    safetyTips;
    videoUrl;
    imageUrl;
    caloriesPerMinute;
    isActive;
    createdBy;
    createdAt;
    updatedAt;
    // Associations
    creator;
    progressLogs;
    // Instance methods
    isForBeginners() {
        return this.difficultyLevel === 'BEGINNER';
    }
    getEstimatedCalories(durationMinutes) {
        if (!this.caloriesPerMinute)
            return 0;
        return Math.round(this.caloriesPerMinute * durationMinutes);
    }
    // Static methods
    static async findByCategory(category) {
        return this.findAll({
            where: {
                category,
                isActive: true
            },
            order: [['name', 'ASC']]
        });
    }
    static async findByMuscleGroup(muscleGroup) {
        return this.findAll({
            where: {
                muscleGroup,
                isActive: true
            },
            order: [['name', 'ASC']]
        });
    }
    static async findByDifficulty(difficultyLevel) {
        return this.findAll({
            where: {
                difficultyLevel,
                isActive: true
            },
            order: [['name', 'ASC']]
        });
    }
}
exports.Exercise = Exercise;
// WorkoutProgressLog model
class WorkoutProgressLog extends sequelize_1.Model {
    id;
    memberId;
    workoutPlanId;
    exerciseId;
    workoutDate;
    setsCompleted;
    repsCompleted;
    weightUsedKg;
    durationMinutes;
    caloriesBurned;
    difficultyRating;
    notes;
    createdAt;
    updatedAt;
    // Associations
    member;
    exercise;
    // Instance methods
    getRating() {
        return this.difficultyRating ? parseInt(this.difficultyRating) : 0;
    }
    isRecent() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return this.workoutDate >= weekAgo;
    }
    // Static methods
    static async getRecentLogs(memberId, days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return this.findAll({
            where: {
                memberId,
                workoutDate: {
                    [require('sequelize').Op.gte]: cutoffDate
                }
            },
            include: [
                {
                    model: Exercise,
                    as: 'exercise',
                    attributes: ['id', 'name', 'category', 'muscleGroup']
                }
            ],
            order: [['workoutDate', 'DESC']]
        });
    }
    static async getMemberStats(memberId) {
        const logs = await this.findAll({
            where: { memberId },
            include: [
                {
                    model: Exercise,
                    as: 'exercise',
                    attributes: ['name']
                }
            ]
        });
        const totalWorkouts = logs.length;
        const totalCalories = logs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
        const ratingsSum = logs.reduce((sum, log) => sum + (log.getRating() || 0), 0);
        const averageRating = totalWorkouts > 0 ? parseFloat((ratingsSum / totalWorkouts).toFixed(1)) : 0;
        // Find favorite exercise
        const exerciseCounts = {};
        logs.forEach(log => {
            const exerciseName = log.exercise?.name || 'Unknown';
            exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1;
        });
        const favoriteExercise = Object.entries(exerciseCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0];
        return {
            totalWorkouts,
            totalCalories,
            averageRating,
            favoriteExercise
        };
    }
}
exports.WorkoutProgressLog = WorkoutProgressLog;
// Initialize Exercise model
Exercise.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 150]
        }
    },
    category: {
        type: sequelize_1.DataTypes.ENUM('CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE', 'FUNCTIONAL', 'SPORTS_SPECIFIC'),
        allowNull: false
    },
    muscleGroup: {
        type: sequelize_1.DataTypes.ENUM('CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'CORE', 'LEGS', 'GLUTES', 'FULL_BODY'),
        allowNull: false,
        field: 'muscle_group'
    },
    equipmentNeeded: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'equipment_needed'
    },
    difficultyLevel: {
        type: sequelize_1.DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
        allowNull: false,
        field: 'difficulty_level'
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    instructions: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    safetyTips: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'safety_tips'
    },
    videoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'video_url'
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'image_url'
    },
    caloriesPerMinute: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'calories_per_minute'
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'is_active'
    },
    createdBy: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'Exercise',
    tableName: 'exercises',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes
    indexes: [
        { fields: ['category'] },
        { fields: ['muscle_group'] },
        { fields: ['difficulty_level'] },
        { fields: ['is_active'] }
    ]
});
// Initialize WorkoutProgressLog model
WorkoutProgressLog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    memberId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'member_id',
        references: {
            model: 'members',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    workoutPlanId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'workout_plan_id',
        references: {
            model: 'workout_plans',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    exerciseId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'exercise_id',
        references: {
            model: 'exercises',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    workoutDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        field: 'workout_date'
    },
    setsCompleted: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'sets_completed'
    },
    repsCompleted: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'reps_completed'
    },
    weightUsedKg: {
        type: sequelize_1.DataTypes.DECIMAL(6, 2),
        allowNull: true,
        field: 'weight_used_kg'
    },
    durationMinutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'duration_minutes'
    },
    caloriesBurned: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'calories_burned'
    },
    difficultyRating: {
        type: sequelize_1.DataTypes.ENUM('1', '2', '3', '4', '5'),
        allowNull: true,
        field: 'difficulty_rating'
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'WorkoutProgressLog',
    tableName: 'workout_progress_logs',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes
    indexes: [
        { fields: ['member_id'] },
        { fields: ['exercise_id'] },
        { fields: ['workout_date'] },
        { fields: ['member_id', 'workout_date'] }
    ]
});
exports.default = { Exercise, WorkoutProgressLog };
//# sourceMappingURL=Exercise.model.js.map