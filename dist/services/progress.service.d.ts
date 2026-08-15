import { Member } from '@/models/Member.model';
import { WorkoutProgressLog } from '@/models/Exercise.model';
export interface ProgressFilters {
    startDate?: string;
    endDate?: string;
    type?: string;
}
export interface WorkoutLogData {
    exerciseId: number;
    workoutPlanId?: number;
    workoutDate: Date;
    setsCompleted?: number;
    repsCompleted?: number;
    weightUsedKg?: number;
    durationMinutes?: number;
    caloriesBurned?: number;
    difficultyRating?: '1' | '2' | '3' | '4' | '5';
    notes?: string;
}
export interface MemberProfileUpdate {
    heightCm?: number;
    weightKg?: number;
    bodyFatPercent?: number;
    muscleMassKg?: number;
    fitnessGoal?: string;
    trainingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    healthCondition?: string;
    medicalNote?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
}
export interface ProgressStatistics {
    currentMetrics: {
        weight?: number;
        bodyFat?: number;
        muscleMass?: number;
        bmi?: number;
    };
    progressTrend: {
        weightChange?: number;
        bodyFatChange?: number;
        muscleMassChange?: number;
        bmiChange?: number;
    };
    workoutStats: {
        totalWorkouts: number;
        thisWeek: number;
        thisMonth: number;
        averagePerWeek: number;
        totalCaloriesBurned: number;
    };
    goalProgress: {
        fitnessGoal?: string;
        trainingLevel: string;
        joinDate: string;
        daysActive: number;
    };
}
export declare class ProgressService {
    getMemberByUserId(userId: number): Promise<Member>;
    getMemberProgress(memberId: number, filters: ProgressFilters): Promise<{
        member: {
            id: any;
            memberCode: any;
            joinDate: any;
            membershipStatus: any;
            user: {
                id: any;
                username: any;
                email: any;
            };
        };
        profile: any;
        workoutLogs: WorkoutProgressLog[];
        summary: {
            totalWorkouts: number;
            avgCaloriesPerSession: number;
            mostFrequentExercise: {
                name: string;
                count: number;
            };
            lastWorkout: Date;
        };
    }>;
    getCurrentMemberProgress(memberId: number): Promise<{
        currentMetrics: {
            weight: any;
            bodyFat: any;
            muscleMass: any;
            bmi: any;
        };
        weeklyFrequency: number;
        progressTrend: {
            isImproving: boolean;
            lastUpdated: any;
        };
        member: {
            id: any;
            memberCode: any;
            joinDate: any;
            membershipStatus: any;
            user: {
                id: any;
                username: any;
                email: any;
            };
        };
        profile: any;
        workoutLogs: WorkoutProgressLog[];
        summary: {
            totalWorkouts: number;
            avgCaloriesPerSession: number;
            mostFrequentExercise: {
                name: string;
                count: number;
            };
            lastWorkout: Date;
        };
    }>;
    updateMemberProfile(memberId: number, updates: MemberProfileUpdate): Promise<Member>;
    createProgressEntry(memberId: number, progressData: any): Promise<Member>;
    getProgressStatistics(memberId: number, period?: string): Promise<ProgressStatistics>;
    getWorkoutProgress(memberId: number, options: {
        limit: number;
        offset: number;
    }): Promise<{
        workouts: WorkoutProgressLog[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            pages: number;
        };
    }>;
    createWorkoutLog(memberId: number, workoutData: WorkoutLogData): Promise<WorkoutProgressLog>;
    private getMostFrequentExercise;
}
//# sourceMappingURL=progress.service.d.ts.map