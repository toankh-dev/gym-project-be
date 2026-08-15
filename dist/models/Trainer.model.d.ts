import { Model, Optional, Association } from 'sequelize';
import { User } from './User.model';
export interface TrainerAttributes {
    id: number;
    userId: number;
    trainerCode: string;
    experienceYears: number;
    ratingAvg: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface TrainerCreationAttributes extends Optional<TrainerAttributes, 'id' | 'experienceYears' | 'ratingAvg' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export interface TrainerProfileAttributes {
    id: number;
    trainerId: number;
    certificate?: string;
    certificatesDetail?: string;
    education?: string;
    skills?: string;
    workExperience?: string;
    introduction?: string;
    trainingPhilosophy?: string;
    achievements?: string;
    availableTime?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface TrainerProfileCreationAttributes extends Optional<TrainerProfileAttributes, 'id' | 'certificate' | 'certificatesDetail' | 'education' | 'skills' | 'workExperience' | 'introduction' | 'trainingPhilosophy' | 'achievements' | 'availableTime' | 'facebookUrl' | 'instagramUrl' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export interface SpecializationAttributes {
    id: number;
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
}
export interface SpecializationCreationAttributes extends Optional<SpecializationAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {
}
export declare class Trainer extends Model<TrainerAttributes, TrainerCreationAttributes> implements TrainerAttributes {
    id: number;
    userId: number;
    trainerCode: string;
    experienceYears: number;
    ratingAvg: number;
    status: 'ACTIVE' | 'INACTIVE';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    user: User;
    profile: TrainerProfile;
    specializations: Specialization[];
    static associations: {
        user: Association<Trainer, User>;
        profile: Association<Trainer, any>;
        specializations: Association<Trainer, any>;
    };
    isActive(): boolean;
    getExperienceLevel(): string;
    getRatingDisplay(): string;
    getRatingStars(): number;
    hasSpecializations(): boolean;
    getSpecializationNames(): string[];
    getStatusColor(): string;
    static findByTrainerCode(trainerCode: string): Promise<Trainer | null>;
    static findWithFullDetails(trainerId: number): Promise<Trainer | null>;
    static findActiveTrainers(): Promise<Trainer[]>;
    static findBySpecialization(specializationId: number): Promise<Trainer[]>;
    static generateTrainerCode(): Promise<string>;
    static getStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        averageRating: number;
        averageExperience: number;
        newThisMonth: number;
        topRated: Trainer[];
    }>;
}
export declare class TrainerProfile extends Model<TrainerProfileAttributes, TrainerProfileCreationAttributes> implements TrainerProfileAttributes {
    id: number;
    trainerId: number;
    certificate?: string;
    certificatesDetail?: string;
    education?: string;
    skills?: string;
    workExperience?: string;
    introduction?: string;
    trainingPhilosophy?: string;
    achievements?: string;
    availableTime?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    trainer: Trainer;
    hasCertificates(): boolean;
    hasWorkExperience(): boolean;
    hasSocialMedia(): boolean;
    getSkillsArray(): string[];
    isProfileComplete(): boolean;
    getCompletionPercentage(): number;
}
export declare class Specialization extends Model<SpecializationAttributes, SpecializationCreationAttributes> implements SpecializationAttributes {
    id: number;
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isActive(): boolean;
    static findActiveSpecializations(): Promise<Specialization[]>;
    static findByName(name: string): Promise<Specialization | null>;
    static getPopularSpecializations(limit?: number): Promise<any[]>;
}
declare const _default: {
    Trainer: typeof Trainer;
    TrainerProfile: typeof TrainerProfile;
    Specialization: typeof Specialization;
};
export default _default;
//# sourceMappingURL=Trainer.model.d.ts.map