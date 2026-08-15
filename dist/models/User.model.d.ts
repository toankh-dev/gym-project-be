import { Model, Optional, Association } from 'sequelize';
import { Role } from './Role.model';
import { UserProfile } from './UserProfile.model';
export interface UserAttributes {
    id: number;
    roleId: number;
    username: string;
    email: string;
    passwordHash: string;
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'lastLoginAt' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    roleId: number;
    username: string;
    email: string;
    passwordHash: string;
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
    lastLoginAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    role: Role;
    profile: UserProfile;
    getRoleData: () => Promise<Role>;
    getProfile: () => Promise<UserProfile>;
    createProfile: (profileData: any) => Promise<UserProfile>;
    static associations: {
        role: Association<User, Role>;
        profile: Association<User, UserProfile>;
    };
    getFullName(): string;
    isActive(): boolean;
    hasRole(roleName: string): boolean;
    hasAnyRole(roleNames: string[]): boolean;
    updateLastLogin(): Promise<User>;
    toSafeJSON(): Partial<UserAttributes>;
    static findByEmail(email: string): Promise<User | null>;
    static findByUsername(username: string): Promise<User | null>;
    static findActiveUsers(): Promise<User[]>;
    static findByRole(roleName: string): Promise<User[]>;
    static countByStatus(status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'): Promise<number>;
    static countByRole(roleName: string): Promise<number>;
}
export default User;
//# sourceMappingURL=User.model.d.ts.map