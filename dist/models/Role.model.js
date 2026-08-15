"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// Role model class
class Role extends sequelize_1.Model {
    // Instance methods
    isAdmin() {
        return this.name === 'ADMIN';
    }
    isStaff() {
        return this.name === 'STAFF';
    }
    isTrainer() {
        return this.name === 'TRAINER';
    }
    isMember() {
        return this.name === 'MEMBER';
    }
    hasPermission(permission) {
        const permissions = this.getPermissions();
        return permissions.includes(permission);
    }
    getPermissions() {
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
    getDisplayName() {
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
    static async findByName(name) {
        return this.findOne({ where: { name } });
    }
    static async getAdminRole() {
        return this.findByName('ADMIN');
    }
    static async getStaffRole() {
        return this.findByName('STAFF');
    }
    static async getTrainerRole() {
        return this.findByName('TRAINER');
    }
    static async getMemberRole() {
        return this.findByName('MEMBER');
    }
    static async getAllRoles() {
        return this.findAll({
            order: [['id', 'ASC']]
        });
    }
    static getHierarchy() {
        return {
            'ADMIN': 1,
            'STAFF': 2,
            'TRAINER': 3,
            'MEMBER': 4
        };
    }
    static isHigherRole(role1, role2) {
        const hierarchy = this.getHierarchy();
        return hierarchy[role1] < hierarchy[role2];
    }
    static isEqualOrHigherRole(role1, role2) {
        const hierarchy = this.getHierarchy();
        return hierarchy[role1] <= hierarchy[role2];
    }
}
exports.Role = Role;
// Initialize the model
Role.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.ENUM('ADMIN', 'STAFF', 'TRAINER', 'MEMBER'),
        allowNull: false,
        unique: true,
        validate: {
            isIn: [['ADMIN', 'STAFF', 'TRAINER', 'MEMBER']]
        }
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [5, 255]
        }
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['name']
        }
    ]
});
exports.default = Role;
//# sourceMappingURL=Role.model.js.map