"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseHealth = exports.modelUtils = exports.models = exports.sequelize = exports.Payment = exports.WorkoutPlanExercise = exports.WorkoutPlan = exports.WorkoutProgressLog = exports.Exercise = exports.MemberSubscription = exports.MembershipPackage = exports.AttendanceLog = exports.ScheduleMember = exports.TrainingSchedule = exports.Specialization = exports.TrainerProfile = exports.Trainer = exports.MemberPreference = exports.MemberProfile = exports.Member = exports.UserProfile = exports.Role = exports.User = exports.defineAssociations = void 0;
// Import all models
const User_model_1 = require("./User.model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_model_1.User; } });
const Role_model_1 = require("./Role.model");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return Role_model_1.Role; } });
const UserProfile_model_1 = require("./UserProfile.model");
Object.defineProperty(exports, "UserProfile", { enumerable: true, get: function () { return UserProfile_model_1.UserProfile; } });
const Member_model_1 = require("./Member.model");
Object.defineProperty(exports, "Member", { enumerable: true, get: function () { return Member_model_1.Member; } });
Object.defineProperty(exports, "MemberProfile", { enumerable: true, get: function () { return Member_model_1.MemberProfile; } });
Object.defineProperty(exports, "MemberPreference", { enumerable: true, get: function () { return Member_model_1.MemberPreference; } });
const Trainer_model_1 = require("./Trainer.model");
Object.defineProperty(exports, "Trainer", { enumerable: true, get: function () { return Trainer_model_1.Trainer; } });
Object.defineProperty(exports, "TrainerProfile", { enumerable: true, get: function () { return Trainer_model_1.TrainerProfile; } });
Object.defineProperty(exports, "Specialization", { enumerable: true, get: function () { return Trainer_model_1.Specialization; } });
const Schedule_model_1 = require("./Schedule.model");
Object.defineProperty(exports, "TrainingSchedule", { enumerable: true, get: function () { return Schedule_model_1.TrainingSchedule; } });
Object.defineProperty(exports, "ScheduleMember", { enumerable: true, get: function () { return Schedule_model_1.ScheduleMember; } });
Object.defineProperty(exports, "AttendanceLog", { enumerable: true, get: function () { return Schedule_model_1.AttendanceLog; } });
const Subscription_model_1 = require("./Subscription.model");
Object.defineProperty(exports, "MembershipPackage", { enumerable: true, get: function () { return Subscription_model_1.MembershipPackage; } });
Object.defineProperty(exports, "MemberSubscription", { enumerable: true, get: function () { return Subscription_model_1.MemberSubscription; } });
const Exercise_model_1 = require("./Exercise.model");
Object.defineProperty(exports, "Exercise", { enumerable: true, get: function () { return Exercise_model_1.Exercise; } });
Object.defineProperty(exports, "WorkoutProgressLog", { enumerable: true, get: function () { return Exercise_model_1.WorkoutProgressLog; } });
const WorkoutPlan_model_1 = require("./WorkoutPlan.model");
Object.defineProperty(exports, "WorkoutPlan", { enumerable: true, get: function () { return WorkoutPlan_model_1.WorkoutPlan; } });
Object.defineProperty(exports, "WorkoutPlanExercise", { enumerable: true, get: function () { return WorkoutPlan_model_1.WorkoutPlanExercise; } });
const Payment_model_1 = require("./Payment.model");
Object.defineProperty(exports, "Payment", { enumerable: true, get: function () { return Payment_model_1.Payment; } });
// Define all associations
const defineAssociations = () => {
    // User associations
    User_model_1.User.belongsTo(Role_model_1.Role, {
        foreignKey: 'roleId',
        as: 'role'
    });
    User_model_1.User.hasOne(UserProfile_model_1.UserProfile, {
        foreignKey: 'userId',
        as: 'profile'
    });
    User_model_1.User.hasOne(Member_model_1.Member, {
        foreignKey: 'userId',
        as: 'memberProfile'
    });
    User_model_1.User.hasOne(Trainer_model_1.Trainer, {
        foreignKey: 'userId',
        as: 'trainerProfile'
    });
    // Role associations
    Role_model_1.Role.hasMany(User_model_1.User, {
        foreignKey: 'roleId',
        as: 'users'
    });
    // UserProfile associations
    UserProfile_model_1.UserProfile.belongsTo(User_model_1.User, {
        foreignKey: 'userId',
        as: 'user'
    });
    // Member associations
    Member_model_1.Member.belongsTo(User_model_1.User, {
        foreignKey: 'userId',
        as: 'user'
    });
    Member_model_1.Member.hasOne(Member_model_1.MemberProfile, {
        foreignKey: 'memberId',
        as: 'profile'
    });
    Member_model_1.Member.belongsTo(Trainer_model_1.Trainer, {
        foreignKey: 'assignedTrainerId',
        as: 'assignedTrainer'
    });
    // MemberProfile associations
    Member_model_1.MemberProfile.belongsTo(Member_model_1.Member, {
        foreignKey: 'memberId',
        as: 'member'
    });
    // MemberPreference associations
    Member_model_1.Member.hasOne(Member_model_1.MemberPreference, {
        foreignKey: 'memberId',
        as: 'preferences'
    });
    Member_model_1.MemberPreference.belongsTo(Member_model_1.Member, {
        foreignKey: 'memberId',
        as: 'member'
    });
    // Trainer associations
    Trainer_model_1.Trainer.belongsTo(User_model_1.User, {
        foreignKey: 'userId',
        as: 'user'
    });
    Trainer_model_1.Trainer.hasOne(Trainer_model_1.TrainerProfile, {
        foreignKey: 'trainerId',
        as: 'profile'
    });
    Trainer_model_1.Trainer.hasMany(Member_model_1.Member, {
        foreignKey: 'assignedTrainerId',
        as: 'assignedMembers'
    });
    Trainer_model_1.Trainer.belongsToMany(Trainer_model_1.Specialization, {
        through: 'trainer_specializations',
        foreignKey: 'trainer_id',
        otherKey: 'specialization_id',
        as: 'specializations',
        timestamps: false
    });
    // TrainerProfile associations
    Trainer_model_1.TrainerProfile.belongsTo(Trainer_model_1.Trainer, {
        foreignKey: 'trainerId',
        as: 'trainer'
    });
    // Specialization associations
    Trainer_model_1.Specialization.belongsToMany(Trainer_model_1.Trainer, {
        through: 'trainer_specializations',
        foreignKey: 'specialization_id',
        otherKey: 'trainer_id',
        as: 'trainers',
        timestamps: false
    });
    // TrainingSchedule associations
    Schedule_model_1.TrainingSchedule.belongsTo(Trainer_model_1.Trainer, {
        foreignKey: 'trainerId',
        as: 'trainer'
    });
    // TrainingSchedule.belongsTo(User, {
    //   foreignKey: 'createdBy',
    //   as: 'creator'
    // }); // Commented out - created_by column doesn't exist in database
    Schedule_model_1.TrainingSchedule.hasMany(Schedule_model_1.ScheduleMember, {
        foreignKey: 'scheduleId',
        as: 'registeredMembers'
    });
    Schedule_model_1.TrainingSchedule.hasMany(Schedule_model_1.AttendanceLog, {
        foreignKey: 'scheduleId',
        as: 'attendanceLogs'
    });
    // ScheduleMember associations
    Schedule_model_1.ScheduleMember.belongsTo(Schedule_model_1.TrainingSchedule, {
        foreignKey: 'scheduleId',
        as: 'schedule'
    });
    Schedule_model_1.ScheduleMember.belongsTo(Member_model_1.Member, {
        foreignKey: 'memberId',
        as: 'member'
    });
    // AttendanceLog associations
    Schedule_model_1.AttendanceLog.belongsTo(Member_model_1.Member, {
        foreignKey: 'memberId',
        as: 'member'
    });
    Schedule_model_1.AttendanceLog.belongsTo(Schedule_model_1.TrainingSchedule, {
        foreignKey: 'scheduleId',
        as: 'schedule'
    });
    // Update Trainer associations to include schedules
    Trainer_model_1.Trainer.hasMany(Schedule_model_1.TrainingSchedule, {
        foreignKey: 'trainerId',
        as: 'schedules'
    });
    // Update Member associations to include schedule registrations and attendance
    Member_model_1.Member.hasMany(Schedule_model_1.ScheduleMember, {
        foreignKey: 'memberId',
        as: 'scheduleRegistrations'
    });
    Member_model_1.Member.hasMany(Schedule_model_1.AttendanceLog, {
        foreignKey: 'memberId',
        as: 'attendanceHistory'
    });
    // Update User associations to include created schedules
    // User.hasMany(TrainingSchedule, {
    //   foreignKey: 'createdBy',
    //   as: 'createdSchedules'
    // }); // Commented out - createdBy field doesn't exist in TrainingSchedule model
    // Subscription associations
    Subscription_model_1.MembershipPackage.hasMany(Subscription_model_1.MemberSubscription, {
        foreignKey: 'packageId',
        as: 'subscriptions'
    });
    Subscription_model_1.MemberSubscription.belongsTo(Subscription_model_1.MembershipPackage, {
        foreignKey: 'packageId',
        as: 'package'
    });
    Subscription_model_1.MemberSubscription.belongsTo(Member_model_1.Member, {
        foreignKey: 'memberId',
        as: 'member'
    });
    Subscription_model_1.MemberSubscription.belongsTo(User_model_1.User, {
        foreignKey: 'registeredBy',
        as: 'registeredByUser'
    });
    Member_model_1.Member.hasMany(Subscription_model_1.MemberSubscription, {
        foreignKey: 'memberId',
        as: 'subscriptions'
    });
    Member_model_1.Member.belongsTo(Subscription_model_1.MemberSubscription, {
        foreignKey: 'currentSubscriptionId',
        as: 'currentSubscription'
    });
    // Exercise associations
    Exercise_model_1.Exercise.belongsTo(User_model_1.User, {
        foreignKey: 'createdBy',
        as: 'creator'
    });
    Exercise_model_1.Exercise.hasMany(Exercise_model_1.WorkoutProgressLog, {
        foreignKey: 'exerciseId',
        as: 'progressLogs'
    });
    // WorkoutProgressLog associations
    Exercise_model_1.WorkoutProgressLog.belongsTo(Member_model_1.Member, {
        foreignKey: 'memberId',
        as: 'member'
    });
    Exercise_model_1.WorkoutProgressLog.belongsTo(Exercise_model_1.Exercise, {
        foreignKey: 'exerciseId',
        as: 'exercise'
    });
    // Member to WorkoutProgressLog association
    Member_model_1.Member.hasMany(Exercise_model_1.WorkoutProgressLog, {
        foreignKey: 'memberId',
        as: 'workoutLogs'
    });
    // User to Exercise association
    User_model_1.User.hasMany(Exercise_model_1.Exercise, {
        foreignKey: 'createdBy',
        as: 'createdExercises'
    });
    // WorkoutPlan associations
    WorkoutPlan_model_1.WorkoutPlan.belongsTo(Member_model_1.Member, { foreignKey: 'memberId', as: 'member' });
    WorkoutPlan_model_1.WorkoutPlan.belongsTo(Trainer_model_1.Trainer, { foreignKey: 'trainerId', as: 'trainer' });
    WorkoutPlan_model_1.WorkoutPlan.hasMany(WorkoutPlan_model_1.WorkoutPlanExercise, { foreignKey: 'workoutPlanId', as: 'exercises' });
    WorkoutPlan_model_1.WorkoutPlanExercise.belongsTo(WorkoutPlan_model_1.WorkoutPlan, { foreignKey: 'workoutPlanId', as: 'plan' });
    WorkoutPlan_model_1.WorkoutPlanExercise.belongsTo(Exercise_model_1.Exercise, { foreignKey: 'exerciseId', as: 'exercise' });
    // Payment associations
    Payment_model_1.Payment.belongsTo(Member_model_1.Member, { foreignKey: 'memberId', as: 'member' });
    Payment_model_1.Payment.belongsTo(Subscription_model_1.MemberSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
};
exports.defineAssociations = defineAssociations;
// Initialize associations
(0, exports.defineAssociations)();
// Export sequelize instance
var database_config_1 = require("@/config/database.config");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return __importDefault(database_config_1).default; } });
// Model registry for easy access
exports.models = {
    User: User_model_1.User,
    Role: Role_model_1.Role,
    UserProfile: UserProfile_model_1.UserProfile,
    Member: Member_model_1.Member,
    MemberProfile: Member_model_1.MemberProfile,
    MemberPreference: Member_model_1.MemberPreference,
    Trainer: Trainer_model_1.Trainer,
    TrainerProfile: Trainer_model_1.TrainerProfile,
    Specialization: Trainer_model_1.Specialization,
    TrainingSchedule: Schedule_model_1.TrainingSchedule,
    ScheduleMember: Schedule_model_1.ScheduleMember,
    AttendanceLog: Schedule_model_1.AttendanceLog,
    MembershipPackage: Subscription_model_1.MembershipPackage,
    MemberSubscription: Subscription_model_1.MemberSubscription,
    Exercise: Exercise_model_1.Exercise,
    WorkoutProgressLog: Exercise_model_1.WorkoutProgressLog
};
// Helper functions for model operations
exports.modelUtils = {
    // Get all model names
    getModelNames: () => {
        return Object.keys(exports.models);
    },
    // Get model by name
    getModel: (name) => {
        return exports.models[name];
    },
    // Check if model exists
    hasModel: (name) => {
        return name in exports.models;
    },
    // Sync all models (for development)
    syncAll: async (options = {}) => {
        const { default: sequelize } = await Promise.resolve().then(() => __importStar(require('@/config/database.config')));
        await sequelize.sync(options);
    },
    // Drop all tables (dangerous - for testing only)
    dropAll: async () => {
        const { default: sequelize } = await Promise.resolve().then(() => __importStar(require('@/config/database.config')));
        await sequelize.drop();
    }
};
// Database health check
const checkDatabaseHealth = async () => {
    try {
        const { default: sequelize } = await Promise.resolve().then(() => __importStar(require('@/config/database.config')));
        // Check connection
        await sequelize.authenticate();
        // Check each model
        const modelHealth = {};
        for (const [modelName, model] of Object.entries(exports.models)) {
            try {
                await model.findOne({ limit: 1 });
                modelHealth[modelName] = true;
            }
            catch (error) {
                modelHealth[modelName] = false;
            }
        }
        return {
            connected: true,
            models: modelHealth
        };
    }
    catch (error) {
        return {
            connected: false,
            models: {},
            error: error.message
        };
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.default = exports.models;
//# sourceMappingURL=index.js.map