// Import all models
import { User } from './User.model';
import { Role } from './Role.model';
import { UserProfile } from './UserProfile.model';
import { Member, MemberProfile, MemberPreference } from './Member.model';
import { Trainer, TrainerProfile, Specialization } from './Trainer.model';
import { TrainingSchedule, ScheduleMember, AttendanceLog } from './Schedule.model';
import { MembershipPackage, MemberSubscription } from './Subscription.model';
import { Exercise, WorkoutProgressLog } from './Exercise.model';
import { WorkoutPlan, WorkoutPlanExercise } from './WorkoutPlan.model';
import { Payment } from './Payment.model';

// Define all associations
export const defineAssociations = (): void => {
  // User associations
  User.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role'
  });

  User.hasOne(UserProfile, {
    foreignKey: 'userId',
    as: 'profile'
  });

  User.hasOne(Member, {
    foreignKey: 'userId',
    as: 'memberProfile'
  });

  User.hasOne(Trainer, {
    foreignKey: 'userId',
    as: 'trainerProfile'
  });

  // Role associations
  Role.hasMany(User, {
    foreignKey: 'roleId',
    as: 'users'
  });

  // UserProfile associations
  UserProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Member associations
  Member.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  Member.hasOne(MemberProfile, {
    foreignKey: 'memberId',
    as: 'profile'
  });

  Member.belongsTo(Trainer, {
    foreignKey: 'assignedTrainerId',
    as: 'assignedTrainer'
  });

  // MemberProfile associations
  MemberProfile.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
  });

  // MemberPreference associations
  Member.hasOne(MemberPreference, {
    foreignKey: 'memberId',
    as: 'preferences'
  });

  MemberPreference.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
  });

  // Trainer associations
  Trainer.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  Trainer.hasOne(TrainerProfile, {
    foreignKey: 'trainerId',
    as: 'profile'
  });

  Trainer.hasMany(Member, {
    foreignKey: 'assignedTrainerId',
    as: 'assignedMembers'
  });

  Trainer.belongsToMany(Specialization, {
    through: 'trainer_specializations',
    foreignKey: 'trainer_id',
    otherKey: 'specialization_id',
    as: 'specializations',
    timestamps: false
  });

  // TrainerProfile associations
  TrainerProfile.belongsTo(Trainer, {
    foreignKey: 'trainerId',
    as: 'trainer'
  });

  // Specialization associations
  Specialization.belongsToMany(Trainer, {
    through: 'trainer_specializations',
    foreignKey: 'specialization_id',
    otherKey: 'trainer_id',
    as: 'trainers',
    timestamps: false
  });

  // TrainingSchedule associations
  TrainingSchedule.belongsTo(Trainer, {
    foreignKey: 'trainerId',
    as: 'trainer'
  });

  // TrainingSchedule.belongsTo(User, {
  //   foreignKey: 'createdBy',
  //   as: 'creator'
  // }); // Commented out - created_by column doesn't exist in database

  TrainingSchedule.hasMany(ScheduleMember, {
    foreignKey: 'scheduleId',
    as: 'registeredMembers'
  });

  TrainingSchedule.hasMany(AttendanceLog, {
    foreignKey: 'scheduleId',
    as: 'attendanceLogs'
  });

  // ScheduleMember associations
  ScheduleMember.belongsTo(TrainingSchedule, {
    foreignKey: 'scheduleId',
    as: 'schedule'
  });

  ScheduleMember.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
  });

  // AttendanceLog associations
  AttendanceLog.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
  });

  AttendanceLog.belongsTo(TrainingSchedule, {
    foreignKey: 'scheduleId',
    as: 'schedule'
  });

  // Update Trainer associations to include schedules
  Trainer.hasMany(TrainingSchedule, {
    foreignKey: 'trainerId',
    as: 'schedules'
  });

  // Update Member associations to include schedule registrations and attendance
  Member.hasMany(ScheduleMember, {
    foreignKey: 'memberId',
    as: 'scheduleRegistrations'
  });

  Member.hasMany(AttendanceLog, {
    foreignKey: 'memberId',
    as: 'attendanceHistory'
  });

  // Update User associations to include created schedules
  // User.hasMany(TrainingSchedule, {
  //   foreignKey: 'createdBy',
  //   as: 'createdSchedules'
  // }); // Commented out - createdBy field doesn't exist in TrainingSchedule model

  // Subscription associations
  MembershipPackage.hasMany(MemberSubscription, {
    foreignKey: 'packageId',
    as: 'subscriptions'
  });

  MemberSubscription.belongsTo(MembershipPackage, {
    foreignKey: 'packageId',
    as: 'package'
  });

  MemberSubscription.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
  });

  MemberSubscription.belongsTo(User, {
    foreignKey: 'registeredBy',
    as: 'registeredByUser'
  });

  Member.hasMany(MemberSubscription, {
    foreignKey: 'memberId',
    as: 'subscriptions'
  });

  Member.belongsTo(MemberSubscription, {
    foreignKey: 'currentSubscriptionId',
    as: 'currentSubscription'
  });

  // Exercise associations
  Exercise.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  Exercise.hasMany(WorkoutProgressLog, {
    foreignKey: 'exerciseId',
    as: 'progressLogs'
  });

  // WorkoutProgressLog associations
  WorkoutProgressLog.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
  });

  WorkoutProgressLog.belongsTo(Exercise, {
    foreignKey: 'exerciseId',
    as: 'exercise'
  });

  // Member to WorkoutProgressLog association
  Member.hasMany(WorkoutProgressLog, {
    foreignKey: 'memberId',
    as: 'workoutLogs'
  });

  // User to Exercise association
  User.hasMany(Exercise, {
    foreignKey: 'createdBy',
    as: 'createdExercises'
  });

  // WorkoutPlan associations
  WorkoutPlan.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });
  WorkoutPlan.belongsTo(Trainer, { foreignKey: 'trainerId', as: 'trainer' });
  WorkoutPlan.hasMany(WorkoutPlanExercise, { foreignKey: 'workoutPlanId', as: 'exercises' });
  WorkoutPlanExercise.belongsTo(WorkoutPlan, { foreignKey: 'workoutPlanId', as: 'plan' });
  WorkoutPlanExercise.belongsTo(Exercise, { foreignKey: 'exerciseId', as: 'exercise' });

  // Payment associations
  Payment.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });
  Payment.belongsTo(MemberSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
};

// Initialize associations
defineAssociations();

// Export all models
export {
  User,
  Role,
  UserProfile,
  Member,
  MemberProfile,
  MemberPreference,
  Trainer,
  TrainerProfile,
  Specialization,
  TrainingSchedule,
  ScheduleMember,
  AttendanceLog,
  MembershipPackage,
  MemberSubscription,
  Exercise,
  WorkoutProgressLog,
  WorkoutPlan,
  WorkoutPlanExercise,
  Payment
};

// Export sequelize instance
export { default as sequelize } from '@/config/database.config';

// Model registry for easy access
export const models = {
  User,
  Role,
  UserProfile,
  Member,
  MemberProfile,
  MemberPreference,
  Trainer,
  TrainerProfile,
  Specialization,
  TrainingSchedule,
  ScheduleMember,
  AttendanceLog,
  MembershipPackage,
  MemberSubscription,
  Exercise,
  WorkoutProgressLog
};

// Helper functions for model operations
export const modelUtils = {
  // Get all model names
  getModelNames: (): string[] => {
    return Object.keys(models);
  },

  // Get model by name
  getModel: (name: string): any => {
    return (models as any)[name];
  },

  // Check if model exists
  hasModel: (name: string): boolean => {
    return name in models;
  },

  // Sync all models (for development)
  syncAll: async (options: { force?: boolean; alter?: boolean } = {}): Promise<void> => {
    const { default: sequelize } = await import('@/config/database.config');
    await sequelize.sync(options);
  },

  // Drop all tables (dangerous - for testing only)
  dropAll: async (): Promise<void> => {
    const { default: sequelize } = await import('@/config/database.config');
    await sequelize.drop();
  }
};

// Type definitions for associations
export interface UserWithAssociations extends User {
  role: Role;
  profile: UserProfile;
  memberProfile?: Member;
  trainerProfile?: Trainer;
}

export interface MemberWithAssociations extends Member {
  user: UserWithAssociations;
  profile: MemberProfile;
  assignedTrainer?: TrainerWithAssociations;
}

export interface TrainerWithAssociations extends Trainer {
  user: UserWithAssociations;
  profile: TrainerProfile;
  specializations: Specialization[];
  assignedMembers?: MemberWithAssociations[];
}

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  connected: boolean;
  models: { [key: string]: boolean };
  error?: string;
}> => {
  try {
    const { default: sequelize } = await import('@/config/database.config');

    // Check connection
    await sequelize.authenticate();

    // Check each model
    const modelHealth: { [key: string]: boolean } = {};

    for (const [modelName, model] of Object.entries(models)) {
      try {
        await (model as any).findOne({ limit: 1 });
        modelHealth[modelName] = true;
      } catch (error) {
        modelHealth[modelName] = false;
      }
    }

    return {
      connected: true,
      models: modelHealth
    };
  } catch (error) {
    return {
      connected: false,
      models: {},
      error: (error as Error).message
    };
  }
};

export default models;