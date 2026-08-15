"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// User model class
class User extends sequelize_1.Model {
    // Associations
    role;
    profile;
    // Association methods
    getRoleData;
    getProfile;
    createProfile;
    // Static associations
    static associations;
    // Instance methods
    getFullName() {
        return this.profile?.fullName || this.username;
    }
    isActive() {
        return this.status === 'ACTIVE';
    }
    hasRole(roleName) {
        return this.role?.name === roleName;
    }
    hasAnyRole(roleNames) {
        return roleNames.includes(this.role?.name);
    }
    updateLastLogin() {
        return this.update({ lastLoginAt: new Date() });
    }
    toSafeJSON() {
        const { passwordHash, ...safeUser } = this.toJSON();
        return safeUser;
    }
    // Static methods
    static async findByEmail(email) {
        return this.findOne({
            where: { email },
            include: [
                {
                    association: 'role',
                    attributes: ['id', 'name', 'description']
                },
                {
                    association: 'profile',
                    attributes: { exclude: [] }
                }
            ]
        });
    }
    static async findByUsername(username) {
        return this.findOne({
            where: { username },
            include: [
                {
                    association: 'role',
                    attributes: ['id', 'name', 'description']
                },
                {
                    association: 'profile',
                    attributes: { exclude: [] }
                }
            ]
        });
    }
    static async findActiveUsers() {
        return this.findAll({
            where: { status: 'ACTIVE' },
            include: [
                {
                    association: 'role',
                    attributes: ['id', 'name', 'description']
                },
                {
                    association: 'profile',
                    attributes: ['id', 'fullName', 'avatarUrl']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    }
    static async findByRole(roleName) {
        return this.findAll({
            include: [
                {
                    association: 'role',
                    where: { name: roleName },
                    attributes: ['id', 'name', 'description']
                },
                {
                    association: 'profile',
                    attributes: ['id', 'fullName', 'avatarUrl']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    }
    static async countByStatus(status) {
        return this.count({ where: { status } });
    }
    static async countByRole(roleName) {
        return this.count({
            include: [
                {
                    association: 'role',
                    where: { name: roleName }
                }
            ]
        });
    }
}
exports.User = User;
// Initialize the model
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    roleId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'role_id',
        references: {
            model: 'roles',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    username: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 100],
            notEmpty: true
        }
    },
    email: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            len: [5, 150]
        }
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'password_hash',
        validate: {
            len: [60, 255] // bcrypt hash length
        }
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        validate: {
            len: [10, 20]
        }
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('ACTIVE', 'INACTIVE', 'LOCKED'),
        defaultValue: 'ACTIVE',
        allowNull: false
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at'
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['username']
        },
        {
            fields: ['role_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['email', 'status']
        }
    ]
});
exports.default = User;
//# sourceMappingURL=User.model.js.map