import { Model, Optional } from 'sequelize';
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
export interface WorkoutPlanCreationAttributes extends Optional<WorkoutPlanAttributes, 'id' | 'trainerId' | 'description' | 'endDate' | 'notes' | 'createdAt' | 'updatedAt'> {
}
export declare class WorkoutPlan extends Model<WorkoutPlanAttributes, WorkoutPlanCreationAttributes> implements WorkoutPlanAttributes {
    id: number;
    memberId: number;
    trainerId?: number;
    planName: string;
    description?: string;
    goal: WorkoutPlanAttributes['goal'];
    difficultyLevel: WorkoutPlanAttributes['difficultyLevel'];
    durationWeeks: number;
    sessionsPerWeek: number;
    startDate: string;
    endDate?: string;
    status: WorkoutPlanAttributes['status'];
    notes?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
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
export interface WorkoutPlanExerciseCreationAttributes extends Optional<WorkoutPlanExerciseAttributes, 'id' | 'sets' | 'reps' | 'weightKg' | 'durationMinutes' | 'restSeconds' | 'notes' | 'createdAt' | 'updatedAt'> {
}
export declare class WorkoutPlanExercise extends Model<WorkoutPlanExerciseAttributes, WorkoutPlanExerciseCreationAttributes> implements WorkoutPlanExerciseAttributes {
    id: number;
    workoutPlanId: number;
    exerciseId: number;
    dayOfWeek: WorkoutPlanExerciseAttributes['dayOfWeek'];
    exerciseOrder: number;
    sets?: number;
    reps?: string;
    weightKg?: number;
    durationMinutes?: number;
    restSeconds?: number;
    notes?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
//# sourceMappingURL=WorkoutPlan.model.d.ts.map