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
export declare const defineAssociations: () => void;
export { User, Role, UserProfile, Member, MemberProfile, MemberPreference, Trainer, TrainerProfile, Specialization, TrainingSchedule, ScheduleMember, AttendanceLog, MembershipPackage, MemberSubscription, Exercise, WorkoutProgressLog, WorkoutPlan, WorkoutPlanExercise, Payment };
export { default as sequelize } from '@/config/database.config';
export declare const models: {
    User: typeof User;
    Role: typeof Role;
    UserProfile: typeof UserProfile;
    Member: typeof Member;
    MemberProfile: typeof MemberProfile;
    MemberPreference: typeof MemberPreference;
    Trainer: typeof Trainer;
    TrainerProfile: typeof TrainerProfile;
    Specialization: typeof Specialization;
    TrainingSchedule: typeof TrainingSchedule;
    ScheduleMember: typeof ScheduleMember;
    AttendanceLog: typeof AttendanceLog;
    MembershipPackage: typeof MembershipPackage;
    MemberSubscription: typeof MemberSubscription;
    Exercise: typeof Exercise;
    WorkoutProgressLog: typeof WorkoutProgressLog;
};
export declare const modelUtils: {
    getModelNames: () => string[];
    getModel: (name: string) => any;
    hasModel: (name: string) => boolean;
    syncAll: (options?: {
        force?: boolean;
        alter?: boolean;
    }) => Promise<void>;
    dropAll: () => Promise<void>;
};
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
export declare const checkDatabaseHealth: () => Promise<{
    connected: boolean;
    models: {
        [key: string]: boolean;
    };
    error?: string;
}>;
export default models;
//# sourceMappingURL=index.d.ts.map