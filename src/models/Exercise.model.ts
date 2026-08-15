import { DataTypes, Model, Optional, } from 'sequelize';
import sequelize from '@/config/database.config';
import { Member } from './Member.model';
import { User } from './User.model';

// Exercise attributes interface
export interface ExerciseAttributes {
  id: number;
  name: string;
  category: 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'BALANCE' | 'FUNCTIONAL' | 'SPORTS_SPECIFIC';
  muscleGroup: 'CHEST' | 'BACK' | 'SHOULDERS' | 'ARMS' | 'CORE' | 'LEGS' | 'GLUTES' | 'FULL_BODY';
  equipmentNeeded?: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description?: string;
  instructions?: string;
  safetyTips?: string;
  videoUrl?: string;
  imageUrl?: string;
  caloriesPerMinute?: number;
  isActive: boolean;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

// WorkoutProgressLog attributes interface
export interface WorkoutProgressLogAttributes {
  id: number;
  memberId: number;
  workoutPlanId?: number;
  exerciseId: number;
  workoutDate: Date;
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsedKg?: number;
  durationMinutes?: number;
  caloriesBurned?: number;
  difficultyRating?: '1' | '2' | '3' | '4' | '5';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creation attributes
export interface ExerciseCreationAttributes extends Optional<ExerciseAttributes, 'id' | 'equipmentNeeded' | 'description' | 'instructions' | 'safetyTips' | 'videoUrl' | 'imageUrl' | 'caloriesPerMinute' | 'createdBy' | 'createdAt' | 'updatedAt'> {}
export interface WorkoutProgressLogCreationAttributes extends Optional<WorkoutProgressLogAttributes, 'id' | 'workoutPlanId' | 'setsCompleted' | 'repsCompleted' | 'weightUsedKg' | 'durationMinutes' | 'caloriesBurned' | 'difficultyRating' | 'notes' | 'createdAt' | 'updatedAt'> {}

// Exercise model
export class Exercise extends Model<ExerciseAttributes, ExerciseCreationAttributes> implements ExerciseAttributes {
  declare id: number;
  declare name: string;
  declare category: 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'BALANCE' | 'FUNCTIONAL' | 'SPORTS_SPECIFIC';
  declare muscleGroup: 'CHEST' | 'BACK' | 'SHOULDERS' | 'ARMS' | 'CORE' | 'LEGS' | 'GLUTES' | 'FULL_BODY';
  declare equipmentNeeded?: string;
  declare difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  declare description?: string;
  declare instructions?: string;
  declare safetyTips?: string;
  declare videoUrl?: string;
  declare imageUrl?: string;
  declare caloriesPerMinute?: number;
  declare isActive: boolean;
  declare createdBy?: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public creator?: User;
  public progressLogs?: WorkoutProgressLog[];

  // Instance methods
  public isForBeginners(): boolean {
    return this.difficultyLevel === 'BEGINNER';
  }

  public getEstimatedCalories(durationMinutes: number): number {
    if (!this.caloriesPerMinute) return 0;
    return Math.round(this.caloriesPerMinute * durationMinutes);
  }

  // Static methods
  public static async findByCategory(category: string): Promise<Exercise[]> {
    return this.findAll({
      where: {
        category,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
  }

  public static async findByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return this.findAll({
      where: {
        muscleGroup,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
  }

  public static async findByDifficulty(difficultyLevel: string): Promise<Exercise[]> {
    return this.findAll({
      where: {
        difficultyLevel,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
  }
}

// WorkoutProgressLog model
export class WorkoutProgressLog extends Model<WorkoutProgressLogAttributes, WorkoutProgressLogCreationAttributes> implements WorkoutProgressLogAttributes {
  declare id: number;
  declare memberId: number;
  declare workoutPlanId?: number;
  declare exerciseId: number;
  declare workoutDate: Date;
  declare setsCompleted?: number;
  declare repsCompleted?: number;
  declare weightUsedKg?: number;
  declare durationMinutes?: number;
  declare caloriesBurned?: number;
  declare difficultyRating?: '1' | '2' | '3' | '4' | '5';
  declare notes?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public member?: Member;
  public exercise?: Exercise;

  // Instance methods
  public getRating(): number {
    return this.difficultyRating ? parseInt(this.difficultyRating) : 0;
  }

  public isRecent(): boolean {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.workoutDate >= weekAgo;
  }

  // Static methods
  public static async getRecentLogs(memberId: number, days: number = 7): Promise<WorkoutProgressLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.findAll({
      where: {
        memberId,
        workoutDate: {
          [Op.gte]: cutoffDate
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

  public static async getMemberStats(memberId: number): Promise<{
    totalWorkouts: number;
    totalCalories: number;
    averageRating: number;
    favoriteExercise?: string;
  }> {
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
    const exerciseCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      const exerciseName = log.exercise?.name || 'Unknown';
      exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1;
    });

    const favoriteExercise = Object.entries(exerciseCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return {
      totalWorkouts,
      totalCalories,
      averageRating,
      favoriteExercise
    };
  }
}

// Initialize Exercise model
Exercise.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    },
    category: {
      type: DataTypes.ENUM('CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE', 'FUNCTIONAL', 'SPORTS_SPECIFIC'),
      allowNull: false
    },
    muscleGroup: {
      type: DataTypes.ENUM('CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'CORE', 'LEGS', 'GLUTES', 'FULL_BODY'),
      allowNull: false,
      field: 'muscle_group'
    },
    equipmentNeeded: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'equipment_needed'
    },
    difficultyLevel: {
      type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
      allowNull: false,
      field: 'difficulty_level'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    safetyTips: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'safety_tips'
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'video_url'
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_url'
    },
    caloriesPerMinute: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'calories_per_minute'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active'
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  },
  {
    sequelize,
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
  }
);

// Initialize WorkoutProgressLog model
WorkoutProgressLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'workout_date'
    },
    setsCompleted: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'sets_completed'
    },
    repsCompleted: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reps_completed'
    },
    weightUsedKg: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      field: 'weight_used_kg'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_minutes'
    },
    caloriesBurned: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'calories_burned'
    },
    difficultyRating: {
      type: DataTypes.ENUM('1', '2', '3', '4', '5'),
      allowNull: true,
      field: 'difficulty_rating'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
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
  }
);

export default { Exercise, WorkoutProgressLog };