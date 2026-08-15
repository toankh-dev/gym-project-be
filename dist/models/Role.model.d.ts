import { Model, Optional } from 'sequelize';
export interface RoleAttributes {
    id: number;
    name: 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER';
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: number;
    name: 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER';
    description: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isAdmin(): boolean;
    isStaff(): boolean;
    isTrainer(): boolean;
    isMember(): boolean;
    hasPermission(permission: string): boolean;
    getPermissions(): string[];
    getDisplayName(): string;
    static findByName(name: 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER'): Promise<Role | null>;
    static getAdminRole(): Promise<Role | null>;
    static getStaffRole(): Promise<Role | null>;
    static getTrainerRole(): Promise<Role | null>;
    static getMemberRole(): Promise<Role | null>;
    static getAllRoles(): Promise<Role[]>;
    static getHierarchy(): {
        [key: string]: number;
    };
    static isHigherRole(role1: string, role2: string): boolean;
    static isEqualOrHigherRole(role1: string, role2: string): boolean;
}
export default Role;
//# sourceMappingURL=Role.model.d.ts.map