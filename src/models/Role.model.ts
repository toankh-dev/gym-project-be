import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database.config';

// Role attributes interface
export interface RoleAttributes {
  id: number;
  name: 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER';
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Role creation attributes
export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Role model class
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: number;
  declare name: 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER';
  declare description: string;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public isAdmin(): boolean {
    return this.name === 'ADMIN';
  }

  public isStaff(): boolean {
    return this.name === 'STAFF';
  }

  public isTrainer(): boolean {
    return this.name === 'TRAINER';
  }

  public isMember(): boolean {
    return this.name === 'MEMBER';
  }

  public hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  public getPermissions(): string[] {
    switch (this.name) {
      case 'ADMIN':
        return [
          'user:read', 'user:write', 'user:delete',
          'member:read', 'member:write', 'member:delete',
          'trainer:read', 'trainer:write', 'trainer:delete',
          'staff:read', 'staff:write', 'staff:delete',
          'package:read', 'package:write', 'package:delete',
          'subscription:read', 'subscription:write', 'subscription:delete',
          'schedule:read', 'schedule:write', 'schedule:delete',
          'payment:read', 'payment:write', 'payment:delete',
          'analytics:read', 'analytics:write',
          'system:read', 'system:write'
        ];
      case 'STAFF':
        return [
          'member:read', 'member:write',
          'trainer:read',
          'package:read',
          'subscription:read', 'subscription:write',
          'schedule:read', 'schedule:write',
          'payment:read', 'payment:write',
          'analytics:read'
        ];
      case 'TRAINER':
        return [
          'member:read',
          'trainer:read', 'trainer:write:own',
          'schedule:read', 'schedule:write:own',
          'workout:read', 'workout:write',
          'progress:read', 'progress:write'
        ];
      case 'MEMBER':
        return [
          'member:read:own', 'member:write:own',
          'trainer:read',
          'package:read',
          'subscription:read:own',
          'schedule:read', 'schedule:book',
          'payment:read:own',
          'progress:read:own'
        ];
      default:
        return [];
    }
  }

  public getDisplayName(): string {
    switch (this.name) {
      case 'ADMIN':
        return 'Administrator';
      case 'STAFF':
        return 'Staff Member';
      case 'TRAINER':
        return 'Fitness Trainer';
      case 'MEMBER':
        return 'Gym Member';
      default:
        return this.name;
    }
  }

  // Static methods
  public static async findByName(name: 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER'): Promise<Role | null> {
    return this.findOne({ where: { name } });
  }

  public static async getAdminRole(): Promise<Role | null> {
    return this.findByName('ADMIN');
  }

  public static async getStaffRole(): Promise<Role | null> {
    return this.findByName('STAFF');
  }

  public static async getTrainerRole(): Promise<Role | null> {
    return this.findByName('TRAINER');
  }

  public static async getMemberRole(): Promise<Role | null> {
    return this.findByName('MEMBER');
  }

  public static async getAllRoles(): Promise<Role[]> {
    return this.findAll({
      order: [['id', 'ASC']]
    });
  }

  public static getHierarchy(): { [key: string]: number } {
    return {
      'ADMIN': 1,
      'STAFF': 2,
      'TRAINER': 3,
      'MEMBER': 4
    };
  }

  public static isHigherRole(role1: string, role2: string): boolean {
    const hierarchy = this.getHierarchy();
    return hierarchy[role1] < hierarchy[role2];
  }

  public static isEqualOrHigherRole(role1: string, role2: string): boolean {
    const hierarchy = this.getHierarchy();
    return hierarchy[role1] <= hierarchy[role2];
  }
}

// Initialize the model
Role.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM('ADMIN', 'STAFF', 'TRAINER', 'MEMBER'),
      allowNull: false,
      unique: true,
      validate: {
        isIn: [['ADMIN', 'STAFF', 'TRAINER', 'MEMBER']]
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 255]
      }
    }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      }
    ]
  }
);

export default Role;