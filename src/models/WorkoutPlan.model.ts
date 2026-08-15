import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database.config';

export interface WorkoutPlanAttributes {
  id: number;
  memberId: number;
  trainerId?: number;
  planName: string;
  description?: string;
  goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'ENDURANCE' | 'STRENGTH' | 'GENERAL_FITNESS' | 'REHABILITATION';
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationWeeks: number;
  sessionsPerWeek: number;
  startDate: string;
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutPlanCreationAttributes
  extends Optional<WorkoutPlanAttributes,
    'id' | 'trainerId' | 'description' | 'endDate' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class WorkoutPlan extends Model<WorkoutPlanAttributes, WorkoutPlanCreationAttributes>
  implements WorkoutPlanAttributes {
  declare id: number;
  declare memberId: number;
  declare trainerId?: number;
  declare planName: string;
  declare description?: string;
  declare goal: WorkoutPlanAttributes['goal'];
  declare difficultyLevel: WorkoutPlanAttributes['difficultyLevel'];
  declare durationWeeks: number;
  declare sessionsPerWeek: number;
  declare startDate: string;
  declare endDate?: string;
  declare status: WorkoutPlanAttributes['status'];
  declare notes?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface WorkoutPlanExerciseAttributes {
  id: number;
  workoutPlanId: number;
  exerciseId: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  exerciseOrder: number;
  sets?: number;
  reps?: string;
  weightKg?: number;
  durationMinutes?: number;
  restSeconds?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutPlanExerciseCreationAttributes
  extends Optional<WorkoutPlanExerciseAttributes,
    'id' | 'sets' | 'reps' | 'weightKg' | 'durationMinutes' | 'restSeconds' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class WorkoutPlanExercise extends Model<WorkoutPlanExerciseAttributes, WorkoutPlanExerciseCreationAttributes>
  implements WorkoutPlanExerciseAttributes {
  declare id: number;
  declare workoutPlanId: number;
  declare exerciseId: number;
  declare dayOfWeek: WorkoutPlanExerciseAttributes['dayOfWeek'];
  declare exerciseOrder: number;
  declare sets?: number;
  declare reps?: string;
  declare weightKg?: number;
  declare durationMinutes?: number;
  declare restSeconds?: number;
  declare notes?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WorkoutPlan.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    memberId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'member_id' },
    trainerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'trainer_id' },
    planName: { type: DataTypes.STRING(150), allowNull: false, field: 'plan_name' },
    description: { type: DataTypes.TEXT, allowNull: true },
    goal: {
      type: DataTypes.ENUM('WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'GENERAL_FITNESS', 'REHABILITATION'),
      allowNull: false,
    },
    difficultyLevel: {
      type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
      allowNull: false,
      field: 'difficulty_level',
    },
    durationWeeks: { type: DataTypes.INTEGER, allowNull: false, field: 'duration_weeks' },
    sessionsPerWeek: { type: DataTypes.INTEGER, allowNull: false, field: 'sessions_per_week' },
    startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
    endDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'end_date' },
    status: {
      type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'),
      defaultValue: 'DRAFT',
      allowNull: false,
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  } as any,
  {
    sequelize,
    modelName: 'WorkoutPlan',
    tableName: 'workout_plans',
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);

WorkoutPlanExercise.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    workoutPlanId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'workout_plan_id' },
    exerciseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'exercise_id' },
    dayOfWeek: {
      type: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
      allowNull: false,
      field: 'day_of_week',
    },
    exerciseOrder: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false, field: 'exercise_order' },
    sets: { type: DataTypes.INTEGER, allowNull: true },
    reps: { type: DataTypes.STRING(50), allowNull: true },
    weightKg: { type: DataTypes.DECIMAL(6, 2), allowNull: true, field: 'weight_kg' },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_minutes' },
    restSeconds: { type: DataTypes.INTEGER, allowNull: true, field: 'rest_seconds' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  } as any,
  {
    sequelize,
    modelName: 'WorkoutPlanExercise',
    tableName: 'workout_plan_exercises',
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);
