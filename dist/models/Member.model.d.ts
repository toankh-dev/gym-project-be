import { Model, Optional, Association } from 'sequelize';
import { User } from './User.model';
import { Trainer } from './Trainer.model';
export interface MemberAttributes {
    id: number;
    userId: number;
    memberCode: string;
    joinDate: Date;
    membershipStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
    currentSubscriptionId?: number;
    assignedTrainerId?: number;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface MemberCreationAttributes extends Optional<MemberAttributes, 'id' | 'currentSubscriptionId' | 'assignedTrainerId' | 'note' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export interface MemberProfileAttributes {
    id: number;
    memberId: number;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    bodyFatPercent?: number;
    muscleMassKg?: number;
    fitnessGoal?: string;
    trainingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    healthCondition?: string;
    medicalNote?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface MemberProfileCreationAttributes extends Optional<MemberProfileAttributes, 'id' | 'heightCm' | 'weightKg' | 'bmi' | 'bodyFatPercent' | 'muscleMassKg' | 'fitnessGoal' | 'healthCondition' | 'medicalNote' | 'emergencyContactName' | 'emergencyContactPhone' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export interface MemberPreferenceAttributes {
    id: number;
    memberId: number;
    notifyEmail: boolean;
    notifySms: boolean;
    notifyPush: boolean;
    notifyWorkoutReminders: boolean;
    notifySubscriptionExpiry: boolean;
    notifyTrainerMessages: boolean;
    profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
    showProgress: boolean;
    showStats: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MemberPreferenceCreationAttributes extends Optional<MemberPreferenceAttributes, 'id' | 'notifyEmail' | 'notifySms' | 'notifyPush' | 'notifyWorkoutReminders' | 'notifySubscriptionExpiry' | 'notifyTrainerMessages' | 'profileVisibility' | 'showProgress' | 'showStats' | 'createdAt' | 'updatedAt'> {
}
export declare class Member extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
    id: number;
    userId: number;
    memberCode: string;
    joinDate: Date;
    membershipStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
    currentSubscriptionId?: number;
    assignedTrainerId?: number;
    note?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    user: User;
    assignedTrainer?: Trainer;
    profile: MemberProfile;
    static associations: {
        user: Association<Member, User>;
        assignedTrainer: Association<Member, Trainer>;
        profile: Association<Member, any>;
    };
    isActive(): boolean;
    hasAssignedTrainer(): boolean;
    getMembershipDuration(): number;
    getStatusDisplay(): string;
    getStatusColor(): string;
    static findByMemberCode(memberCode: string): Promise<Member | null>;
    static findWithFullDetails(memberId: number): Promise<Member | null>;
    static findByStatus(status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'): Promise<Member[]>;
    static findByTrainer(trainerId: number): Promise<Member[]>;
    static generateMemberCode(): Promise<string>;
    static getStatistics(): Promise<{
        total: number;
        active: number;
        expired: number;
        suspended: number;
        cancelled: number;
        newThisMonth: number;
        withTrainer: number;
    }>;
}
export declare class MemberProfile extends Model<MemberProfileAttributes, MemberProfileCreationAttributes> implements MemberProfileAttributes {
    id: number;
    memberId: number;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    bodyFatPercent?: number;
    muscleMassKg?: number;
    fitnessGoal?: string;
    trainingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    healthCondition?: string;
    medicalNote?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    member: Member;
    calculateBMI(): number | null;
    getBMICategory(): string | null;
    getTrainingLevelDisplay(): string;
    hasHealthConditions(): boolean;
    hasEmergencyContact(): boolean;
    updateBMI(): void;
}
export declare class MemberPreference extends Model<MemberPreferenceAttributes, MemberPreferenceCreationAttributes> implements MemberPreferenceAttributes {
    id: number;
    memberId: number;
    notifyEmail: boolean;
    notifySms: boolean;
    notifyPush: boolean;
    notifyWorkoutReminders: boolean;
    notifySubscriptionExpiry: boolean;
    notifyTrainerMessages: boolean;
    profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
    showProgress: boolean;
    showStats: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    member: Member;
}
declare const _default: {
    Member: typeof Member;
    MemberProfile: typeof MemberProfile;
    MemberPreference: typeof MemberPreference;
};
export default _default;
//# sourceMappingURL=Member.model.d.ts.map