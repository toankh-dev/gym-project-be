"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Specialization = exports.TrainerProfile = exports.Trainer = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// Trainer model class
class Trainer extends sequelize_1.Model {
    id;
    userId;
    trainerCode;
    experienceYears;
    ratingAvg;
    status;
    // Timestamps
    createdAt;
    updatedAt;
    deletedAt;
    // Associations
    user;
    profile;
    specializations;
    // Static associations
    static associations;
    // Instance methods
    isActive() {
        return this.status === 'ACTIVE';
    }
    getExperienceLevel() {
        if (this.experienceYears < 2)
            return 'Junior';
        if (this.experienceYears < 5)
            return 'Mid-level';
        if (this.experienceYears < 10)
            return 'Senior';
        return 'Expert';
    }
    getRatingDisplay() {
        return `${this.ratingAvg.toFixed(1)}/5.0`;
    }
    getRatingStars() {
        return Math.round(this.ratingAvg);
    }
    hasSpecializations() {
        return this.specializations && this.specializations.length > 0;
    }
    getSpecializationNames() {
        return this.specializations ? this.specializations.map(s => s.name) : [];
    }
    getStatusColor() {
        return this.status === 'ACTIVE' ? 'success' : 'default';
    }
    // Static methods
    static async findByTrainerCode(trainerCode) {
        return this.findOne({
            where: { trainerCode },
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
                    association: 'profile'
                },
                {
                    association: 'specializations',
                    where: { status: 'ACTIVE' },
                    required: false
                }
            ]
        });
    }
    static async findWithFullDetails(trainerId) {
        return this.findByPk(trainerId, {
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
                    association: 'profile'
                },
                {
                    association: 'specializations',
                    where: { status: 'ACTIVE' },
                    required: false
                }
            ]
        });
    }
    static async findActiveTrainers() {
        return this.findAll({
            where: { status: 'ACTIVE' },
            include: [
                {
                    association: 'user',
                    attributes: { exclude: ['passwordHash'] },
                    where: { status: 'ACTIVE' },
                    include: [
                        {
                            association: 'profile',
                            attributes: ['id', 'fullName', 'avatarUrl']
                        }
                    ]
                },
                {
                    association: 'profile',
                    attributes: ['id', 'introduction', 'skills']
                },
                {
                    association: 'specializations',
                    where: { status: 'ACTIVE' },
                    required: false
                }
            ],
            order: [['ratingAvg', 'DESC'], ['experienceYears', 'DESC']]
        });
    }
    static async findBySpecialization(specializationId) {
        return this.findAll({
            where: { status: 'ACTIVE' },
            include: [
                {
                    association: 'user',
                    attributes: { exclude: ['passwordHash'] },
                    where: { status: 'ACTIVE' },
                    include: [
                        {
                            association: 'profile',
                            attributes: ['id', 'fullName', 'avatarUrl']
                        }
                    ]
                },
                {
                    association: 'profile'
                },
                {
                    association: 'specializations',
                    where: {
                        id: specializationId,
                        status: 'ACTIVE'
                    }
                }
            ],
            order: [['ratingAvg', 'DESC']]
        });
    }
    static async generateTrainerCode() {
        const prefix = 'T';
        const year = new Date().getFullYear().toString().slice(-2);
        // Find the latest trainer code for this year
        const latestTrainer = await this.findOne({
            where: {
                trainerCode: {
                    [require('sequelize').Op.like]: `${prefix}${year}%`
                }
            },
            order: [['trainerCode', 'DESC']]
        });
        let nextNumber = 1;
        if (latestTrainer) {
            const currentCode = latestTrainer.trainerCode;
            const currentNumber = parseInt(currentCode.slice(-4));
            nextNumber = currentNumber + 1;
        }
        return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
    }
    static async getStatistics() {
        const [total, active, inactive] = await Promise.all([
            this.count(),
            this.count({ where: { status: 'ACTIVE' } }),
            this.count({ where: { status: 'INACTIVE' } })
        ]);
        // Calculate averages
        const trainers = await this.findAll({
            where: { status: 'ACTIVE' },
            attributes: ['ratingAvg', 'experienceYears']
        });
        const averageRating = trainers.length > 0
            ? trainers.reduce((sum, t) => sum + t.ratingAvg, 0) / trainers.length
            : 0;
        const averageExperience = trainers.length > 0
            ? trainers.reduce((sum, t) => sum + t.experienceYears, 0) / trainers.length
            : 0;
        // New trainers this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = await this.count({
            where: {
                created_at: {
                    [require('sequelize').Op.gte]: startOfMonth
                }
            }
        });
        // Top rated trainers
        const topRated = await this.findAll({
            where: {
                status: 'ACTIVE',
                ratingAvg: { [require('sequelize').Op.gte]: 4.0 }
            },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'email'],
                    include: [
                        {
                            association: 'profile',
                            attributes: ['fullName', 'avatarUrl']
                        }
                    ]
                }
            ],
            order: [['ratingAvg', 'DESC']],
            limit: 5
        });
        return {
            total,
            active,
            inactive,
            averageRating: Math.round(averageRating * 100) / 100,
            averageExperience: Math.round(averageExperience * 100) / 100,
            newThisMonth,
            topRated
        };
    }
}
exports.Trainer = Trainer;
// TrainerProfile model class
class TrainerProfile extends sequelize_1.Model {
    id;
    trainerId;
    certificate;
    certificatesDetail;
    education;
    skills;
    workExperience;
    introduction;
    trainingPhilosophy;
    achievements;
    availableTime;
    facebookUrl;
    instagramUrl;
    // Timestamps
    createdAt;
    updatedAt;
    deletedAt;
    // Associations
    trainer;
    // Instance methods
    hasCertificates() {
        return !!(this.certificate || this.certificatesDetail);
    }
    hasWorkExperience() {
        return !!this.workExperience;
    }
    hasSocialMedia() {
        return !!(this.facebookUrl || this.instagramUrl);
    }
    getSkillsArray() {
        if (!this.skills)
            return [];
        return this.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    }
    isProfileComplete() {
        return !!(this.introduction &&
            this.skills &&
            this.trainingPhilosophy &&
            this.availableTime);
    }
    getCompletionPercentage() {
        let completedFields = 0;
        const totalFields = 8; // certificate, education, skills, workExperience, introduction, trainingPhilosophy, achievements, availableTime
        if (this.certificate)
            completedFields++;
        if (this.education)
            completedFields++;
        if (this.skills)
            completedFields++;
        if (this.workExperience)
            completedFields++;
        if (this.introduction)
            completedFields++;
        if (this.trainingPhilosophy)
            completedFields++;
        if (this.achievements)
            completedFields++;
        if (this.availableTime)
            completedFields++;
        return Math.round((completedFields / totalFields) * 100);
    }
}
exports.TrainerProfile = TrainerProfile;
// Specialization model class
class Specialization extends sequelize_1.Model {
    id;
    name;
    description;
    status;
    // Timestamps
    createdAt;
    updatedAt;
    // Instance methods
    isActive() {
        return this.status === 'ACTIVE';
    }
    // Static methods
    static async findActiveSpecializations() {
        return this.findAll({
            where: { status: 'ACTIVE' },
            order: [['name', 'ASC']]
        });
    }
    static async findByName(name) {
        return this.findOne({
            where: { name }
        });
    }
    static async getPopularSpecializations(limit = 10) {
        // This would typically join with trainer_specializations to count usage
        return this.findAll({
            where: { status: 'ACTIVE' },
            order: [['name', 'ASC']],
            limit
        });
    }
}
exports.Specialization = Specialization;
// Initialize Trainer model
Trainer.init({
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
    trainerCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'trainer_code',
        validate: {
            len: [1, 50],
            notEmpty: true
        }
    },
    experienceYears: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        field: 'experience_years',
        validate: {
            min: 0,
            max: 50
        }
    },
    ratingAvg: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
        allowNull: false,
        field: 'rating_avg',
        validate: {
            min: 0,
            max: 5
        }
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
    modelName: 'Trainer',
    tableName: 'trainers',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['trainer_code'] },
        { fields: ['status'] },
        { fields: ['rating_avg'] },
        { fields: ['experience_years'] }
    ]
});
// Initialize TrainerProfile model
TrainerProfile.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    trainerId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        field: 'trainer_id',
        references: {
            model: 'trainers',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    certificate: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255]
        }
    },
    certificatesDetail: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'certificates_detail'
    },
    education: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255]
        }
    },
    skills: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    workExperience: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'work_experience'
    },
    introduction: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    trainingPhilosophy: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'training_philosophy'
    },
    achievements: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    availableTime: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'available_time'
    },
    facebookUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'facebook_url',
        validate: {
            isUrl: true,
            len: [0, 255]
        }
    },
    instagramUrl: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: 'instagram_url'
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
    modelName: 'TrainerProfile',
    tableName: 'trainer_profiles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['trainer_id'] }
    ]
});
// Initialize Specialization model
Specialization.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 100],
            notEmpty: true
        }
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
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
    modelName: 'Specialization',
    tableName: 'specializations',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for specializations
    indexes: [
        { fields: ['name'] },
        { fields: ['status'] }
    ]
});
exports.default = { Trainer, TrainerProfile, Specialization };
//# sourceMappingURL=Trainer.model.js.map