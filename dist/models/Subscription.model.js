"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberSubscription = exports.MembershipPackage = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// MembershipPackage model
class MembershipPackage extends sequelize_1.Model {
    id;
    name;
    durationMonths;
    price;
    description;
    benefits;
    maxSessions;
    allowTrainer;
    status;
    createdAt;
    updatedAt;
    // Instance methods
    isActive() {
        return this.status === 'ACTIVE';
    }
    getMonthlyPrice() {
        return this.price / this.durationMonths;
    }
}
exports.MembershipPackage = MembershipPackage;
// MemberSubscription model
class MemberSubscription extends sequelize_1.Model {
    id;
    memberId;
    packageId;
    startDate;
    endDate;
    actualPrice;
    status;
    renewalReminderSent;
    renewalReminderSentAt;
    registeredBy;
    createdAt;
    updatedAt;
    // Associations
    member;
    package;
    registeredByUser;
    // Instance methods
    isActive() {
        const now = new Date();
        return this.status === 'ACTIVE' && this.endDate >= now;
    }
    isExpired() {
        const now = new Date();
        return this.endDate < now;
    }
    getDaysRemaining() {
        const now = new Date();
        const diffTime = this.endDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
exports.MemberSubscription = MemberSubscription;
// Initialize MembershipPackage model
MembershipPackage.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    durationMonths: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_months'
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    benefits: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    maxSessions: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'max_sessions'
    },
    allowTrainer: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'allow_trainer'
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
        allowNull: false
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
    modelName: 'MembershipPackage',
    tableName: 'membership_packages',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for packages
});
// Initialize MemberSubscription model
MemberSubscription.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    memberId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'member_id',
        references: {
            model: 'members',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    packageId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'package_id',
        references: {
            model: 'membership_packages',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    startDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date'
    },
    endDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        field: 'end_date'
    },
    actualPrice: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'actual_price'
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'PENDING',
        allowNull: false
    },
    renewalReminderSent: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'renewal_reminder_sent'
    },
    renewalReminderSentAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'renewal_reminder_sent_at'
    },
    registeredBy: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'registered_by',
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    modelName: 'MemberSubscription',
    tableName: 'member_subscriptions',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for subscriptions
});
// MembershipPackage and MemberSubscription are already exported at their class definitions
//# sourceMappingURL=Subscription.model.js.map