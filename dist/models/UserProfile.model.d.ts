import { Model, Optional, Association } from 'sequelize';
import { User } from './User.model';
export interface UserProfileAttributes {
    id: number;
    userId: number;
    fullName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: Date;
    avatarUrl?: string;
    address?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface UserProfileCreationAttributes extends Optional<UserProfileAttributes, 'id' | 'dateOfBirth' | 'avatarUrl' | 'address' | 'bio' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class UserProfile extends Model<UserProfileAttributes, UserProfileCreationAttributes> implements UserProfileAttributes {
    id: number;
    userId: number;
    fullName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: Date;
    avatarUrl?: string;
    address?: string;
    bio?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    user: User;
    static associations: {
        user: Association<UserProfile, User>;
    };
    getAge(): number | null;
    getDisplayName(): string;
    getGenderDisplay(): string;
    hasAvatar(): boolean;
    getAvatarUrl(): string;
    isProfileComplete(): boolean;
    getCompletionPercentage(): number;
    static findByUserId(userId: number): Promise<UserProfile | null>;
    static findWithUser(profileId: number): Promise<UserProfile | null>;
    static searchProfiles(searchTerm: string, limit?: number): Promise<UserProfile[]>;
    static getProfilesByGender(gender: 'MALE' | 'FEMALE' | 'OTHER'): Promise<UserProfile[]>;
    static getAgeStatistics(): Promise<{
        averageAge: number;
        minAge: number;
        maxAge: number;
        ageGroups: {
            range: string;
            count: number;
        }[];
    }>;
    static getIncompleteProfiles(): Promise<UserProfile[]>;
}
export default UserProfile;
//# sourceMappingURL=UserProfile.model.d.ts.map