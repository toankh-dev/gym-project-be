"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberPreference = exports.MemberProfile = exports.Member = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// Member model class
class Member extends sequelize_1.Model {
    id;
    userId;
    memberCode;
    joinDate;
    membershipStatus;
    currentSubscriptionId;
    assignedTrainerId;
    note;
    // Timestamps
    createdAt;
    updatedAt;
    deletedAt;
    // Associations
    user;
    assignedTrainer;
    profile;
    // Static associations
    static associations;
    // Instance methods
    isActive() {
        return this.membershipStatus === 'ACTIVE';
    }
    hasAssignedTrainer() {
        return !!this.assignedTrainerId;
    }
    getMembershipDuration() {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - this.joinDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
    }
    getStatusDisplay() {
        switch (this.membershipStatus) {
            case 'ACTIVE':
                return 'Active';
            case 'EXPIRED':
                return 'Expired';
            case 'SUSPENDED':
                return 'Suspended';
            case 'CANCELLED':
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    }
    getStatusColor() {
        switch (this.membershipStatus) {
            case 'ACTIVE':
                return 'success';
            case 'EXPIRED':
                return 'warning';
            case 'SUSPENDED':
                return 'error';
            case 'CANCELLED':
                return 'default';
            default:
                return 'default';
        }
    }
    // Static methods
    static async findByMemberCode(memberCode) {
        return this.findOne({
            where: { memberCode },
            include: [
                {
                    association: 'user',
                    attributes: { exclude: ['passwordHash'] },
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
                },
                {
                    association: 'assignedTrainer',
                    attributes: ['id', 'trainerCode'],
                    include: [
                        {
                            association: 'user',
                            attributes: ['id', 'username', 'email'],
                            include: [
                                {
                                    association: 'profile',
                                    attributes: ['id', 'fullName', 'avatarUrl']
                                }
                            ]
                        }
                    ]
                },
                {
                    association: 'profile'
                }
            ]
        });
    }
    static async findWithFullDetails(memberId) {
        return this.findByPk(memberId, {
            include: [
                {
                    association: 'user',
                    attributes: { exclude: ['passwordHash'] },
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
                },
                {
                    association: 'assignedTrainer',
                    include: [
                        {
                            association: 'user',
                            attributes: ['id', 'username', 'email'],
                            include: [
                                {
                                    association: 'profile',
                                    attributes: ['id', 'fullName', 'avatarUrl']
                                }
                            ]
                        }
                    ]
                },
                {
                    association: 'profile'
                }
            ]
        });
    }
    static async findByStatus(status) {
        return this.findAll({
            where: { membershipStatus: status },
            include: [
                {
                    association: 'user',
                    attributes: { exclude: ['passwordHash'] },
                    include: [
                        {
                            association: 'profile',
                            attributes: ['id', 'fullName', 'avatarUrl']
                        }
                    ]
                }
            ],
            order: [['joinDate', 'DESC']]
        });
    }
    static async findByTrainer(trainerId) {
        return this.findAll({
            where: { assignedTrainerId: trainerId },
            include: [
                {
                    association: 'user',
                    attributes: { exclude: ['passwordHash'] },
                    include: [
                        {
                            association: 'profile',
                            attributes: ['id', 'fullName', 'avatarUrl']
                        }
                    ]
                },
                {
                    association: 'profile'
                }
            ],
            order: [['joinDate', 'DESC']]
        });
    }
    static async generateMemberCode() {
        const prefix = 'M';
        const year = new Date().getFullYear().toString().slice(-2);
        // Find the latest member code for this year
        const latestMember = await this.findOne({
            where: {
                memberCode: {
                    [require('sequelize').Op.like]: `${prefix}${year}%`
                }
            },
            order: [['memberCode', 'DESC']]
        });
        let nextNumber = 1;
        if (latestMember) {
            const currentCode = latestMember.memberCode;
            const currentNumber = parseInt(currentCode.slice(-4));
            nextNumber = currentNumber + 1;
        }
        return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
    }
    static async getStatistics() {
        const [total, active, expired, suspended, cancelled, withTrainer] = await Promise.all([
            this.count(),
            this.count({ where: { membershipStatus: 'ACTIVE' } }),
            this.count({ where: { membershipStatus: 'EXPIRED' } }),
            this.count({ where: { membershipStatus: 'SUSPENDED' } }),
            this.count({ where: { membershipStatus: 'CANCELLED' } }),
            this.count({
                where: {
                    assignedTrainerId: { [require('sequelize').Op.not]: null }
                }
            })
        ]);
        // New members this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = await this.count({
            where: {
                joinDate: {
                    [require('sequelize').Op.gte]: startOfMonth
                }
            }
        });
        return {
            total,
            active,
            expired,
            suspended,
            cancelled,
            newThisMonth,
            withTrainer
        };
    }
}
exports.Member = Member;
// MemberProfile model class
class MemberProfile extends sequelize_1.Model {
    id;
    memberId;
    heightCm;
    weightKg;
    bmi;
    bodyFatPercent;
    muscleMassKg;
    fitnessGoal;
    trainingLevel;
    healthCondition;
    medicalNote;
    emergencyContactName;
    emergencyContactPhone;
    // Timestamps
    createdAt;
    updatedAt;
    deletedAt;
    // Associations
    member;
    // Instance methods
    calculateBMI() {
        if (!this.heightCm || !this.weightKg)
            return null;
        const heightM = this.heightCm / 100;
        return parseFloat((this.weightKg / (heightM * heightM)).toFixed(1));
    }
    getBMICategory() {
        const bmi = this.bmi || this.calculateBMI();
        if (!bmi)
            return null;
        if (bmi < 18.5)
            return 'Underweight';
        if (bmi < 25)
            return 'Normal weight';
        if (bmi < 30)
            return 'Overweight';
        return 'Obese';
    }
    getTrainingLevelDisplay() {
        switch (this.trainingLevel) {
            case 'BEGINNER':
                return 'Beginner';
            case 'INTERMEDIATE':
                return 'Intermediate';
            case 'ADVANCED':
                return 'Advanced';
            default:
                return 'Not specified';
        }
    }
    hasHealthConditions() {
        return !!(this.healthCondition || this.medicalNote);
    }
    hasEmergencyContact() {
        return !!(this.emergencyContactName && this.emergencyContactPhone);
    }
    updateBMI() {
        this.bmi = this.calculateBMI();
    }
}
exports.MemberProfile = MemberProfile;
// MemberPreference model class
class MemberPreference extends sequelize_1.Model {
    id;
    memberId;
    notifyEmail;
    notifySms;
    notifyPush;
    notifyWorkoutReminders;
    notifySubscriptionExpiry;
    notifyTrainerMessages;
    profileVisibility;
    showProgress;
    showStats;
    // Timestamps
    createdAt;
    updatedAt;
    // Associations
    member;
}
exports.MemberPreference = MemberPreference;
// Initialize Member model
Member.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    memberCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'member_code',
        validate: {
            len: [1, 50],
            notEmpty: true
        }
    },
    joinDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        field: 'join_date',
        defaultValue: sequelize_1.DataTypes.NOW
    },
    membershipStatus: {
        type: sequelize_1.DataTypes.ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'),
        defaultValue: 'ACTIVE',
        allowNull: false,
        field: 'membership_status'
    },
    currentSubscriptionId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'current_subscription_id',
        references: {
            model: 'member_subscriptions',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    assignedTrainerId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'assigned_trainer_id',
        references: {
            model: 'trainers',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'Member',
    tableName: 'members',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['member_code'] },
        { fields: ['membership_status'] },
        { fields: ['assigned_trainer_id'] },
        { fields: ['join_date'] }
    ]
});
// Initialize MemberProfile model
MemberProfile.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    memberId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        field: 'member_id',
        references: {
            model: 'members',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    heightCm: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'height_cm',
        validate: {
            min: 50,
            max: 300
        }
    },
    weightKg: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'weight_kg',
        validate: {
            min: 20,
            max: 500
        }
    },
    bmi: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 10,
            max: 100
        }
    },
    bodyFatPercent: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'body_fat_percent',
        validate: {
            min: 0,
            max: 100
        }
    },
    muscleMassKg: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'muscle_mass_kg',
        validate: {
            min: 0,
            max: 200
        }
    },
    fitnessGoal: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'fitness_goal',
        validate: {
            len: [0, 255]
        }
    },
    trainingLevel: {
        type: sequelize_1.DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
        defaultValue: 'BEGINNER',
        allowNull: false,
        field: 'training_level'
    },
    healthCondition: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'health_condition'
    },
    medicalNote: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'medical_note'
    },
    emergencyContactName: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: true,
        field: 'emergency_contact_name',
        validate: {
            len: [0, 150]
        }
    },
    emergencyContactPhone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        field: 'emergency_contact_phone',
        validate: {
            len: [0, 20]
        }
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'MemberProfile',
    tableName: 'member_profiles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['member_id'] },
        { fields: ['training_level'] }
    ],
    hooks: {
        beforeSave: (profile) => {
            // Auto-calculate BMI if height and weight are provided
            if (profile.heightCm && profile.weightKg) {
                profile.updateBMI();
            }
        }
    }
});
// Initialize MemberPreference model
MemberPreference.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    memberId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        field: 'member_id',
        references: {
            model: 'members',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    notifyEmail: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_email'
    },
    notifySms: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'notify_sms'
    },
    notifyPush: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_push'
    },
    notifyWorkoutReminders: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_workout_reminders'
    },
    notifySubscriptionExpiry: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_subscription_expiry'
    },
    notifyTrainerMessages: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_trainer_messages'
    },
    profileVisibility: {
        type: sequelize_1.DataTypes.ENUM('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'),
        allowNull: false,
        defaultValue: 'MEMBERS_ONLY',
        field: 'profile_visibility'
    },
    showProgress: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'show_progress'
    },
    showStats: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'show_stats'
    }
}, {
    sequelize: database_config_1.default,
    modelName: 'MemberPreference',
    tableName: 'member_preferences',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
        { fields: ['member_id'] }
    ]
});
exports.default = { Member, MemberProfile, MemberPreference };
//# sourceMappingURL=Member.model.js.map