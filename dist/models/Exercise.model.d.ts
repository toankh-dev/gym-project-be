import { Model, Optional } from 'sequelize';
import { Member } from './Member.model';
import { User } from './User.model';
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
export interface ExerciseCreationAttributes extends Optional<ExerciseAttributes, 'id' | 'equipmentNeeded' | 'description' | 'instructions' | 'safetyTips' | 'videoUrl' | 'imageUrl' | 'caloriesPerMinute' | 'createdBy' | 'createdAt' | 'updatedAt'> {
}
export interface WorkoutProgressLogCreationAttributes extends Optional<WorkoutProgressLogAttributes, 'id' | 'workoutPlanId' | 'setsCompleted' | 'repsCompleted' | 'weightUsedKg' | 'durationMinutes' | 'caloriesBurned' | 'difficultyRating' | 'notes' | 'createdAt' | 'updatedAt'> {
}
export declare class Exercise extends Model<ExerciseAttributes, ExerciseCreationAttributes> implements ExerciseAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    creator?: User;
    progressLogs?: WorkoutProgressLog[];
    isForBeginners(): boolean;
    getEstimatedCalories(durationMinutes: number): number;
    static findByCategory(category: string): Promise<Exercise[]>;
    static findByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
    static findByDifficulty(difficultyLevel: string): Promise<Exercise[]>;
}
export declare class WorkoutProgressLog extends Model<WorkoutProgressLogAttributes, WorkoutProgressLogCreationAttributes> implements WorkoutProgressLogAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    member?: Member;
    exercise?: Exercise;
    getRating(): number;
    isRecent(): boolean;
    static getRecentLogs(memberId: number, days?: number): Promise<WorkoutProgressLog[]>;
    static getMemberStats(memberId: number): Promise<{
        totalWorkouts: number;
        totalCalories: number;
        averageRating: number;
        favoriteExercise?: string;
    }>;
}
declare const _default: {
    Exercise: typeof Exercise;
    WorkoutProgressLog: typeof WorkoutProgressLog;
};
export default _default;
//# sourceMappingURL=Exercise.model.d.ts.map