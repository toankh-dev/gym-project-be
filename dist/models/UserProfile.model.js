"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// UserProfile model class
class UserProfile extends sequelize_1.Model {
    // Associations
    user;
    // Static associations
    static associations;
    // Instance methods
    getAge() {
        if (!this.dateOfBirth)
            return null;
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    getDisplayName() {
        return this.fullName || `User #${this.userId}`;
    }
    getGenderDisplay() {
        switch (this.gender) {
            case 'MALE':
                return 'Male';
            case 'FEMALE':
                return 'Female';
            case 'OTHER':
                return 'Other';
            default:
                return 'Not specified';
        }
    }
    hasAvatar() {
        return !!this.avatarUrl;
    }
    getAvatarUrl() {
        return this.avatarUrl || '/uploads/avatars/default-avatar.png';
    }
    isProfileComplete() {
        return !!(this.fullName && this.gender && this.dateOfBirth);
    }
    getCompletionPercentage() {
        let completedFields = 0;
        const totalFields = 6; // fullName, gender, dateOfBirth, avatarUrl, address, bio
        if (this.fullName)
            completedFields++;
        if (this.gender)
            completedFields++;
        if (this.dateOfBirth)
            completedFields++;
        if (this.avatarUrl)
            completedFields++;
        if (this.address)
            completedFields++;
        if (this.bio)
            completedFields++;
        return Math.round((completedFields / totalFields) * 100);
    }
    // Static methods
    static async findByUserId(userId) {
        return this.findOne({
            where: { userId },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                }
            ]
        });
    }
    static async findWithUser(profileId) {
        return this.findByPk(profileId, {
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'username', 'email', 'status', 'roleId'],
                    include: [
                        {
                            association: 'role',
                            attributes: ['id', 'name', 'description']
                        }
                    ]
                }
            ]
        });
    }
    static async searchProfiles(searchTerm, limit = 10) {
        const { Op } = require('sequelize');
        return this.findAll({
            where: {
                [Op.or]: [
                    {
                        fullName: {
                            [Op.like]: `%${searchTerm}%`
                        }
                    },
                    {
                        bio: {
                            [Op.like]: `%${searchTerm}%`
                        }
                    }
                ]
            },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'username', 'email', 'status'],
                    where: { status: 'ACTIVE' }
                }
            ],
            limit,
            order: [['fullName', 'ASC']]
        });
    }
    static async getProfilesByGender(gender) {
        return this.findAll({
            where: { gender },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'username', 'email', 'status'],
                    where: { status: 'ACTIVE' }
                }
            ],
            order: [['fullName', 'ASC']]
        });
    }
    static async getAgeStatistics() {
        const profiles = await this.findAll({
            where: {
                dateOfBirth: {
                    [require('sequelize').Op.not]: null
                }
            },
            include: [
                {
                    association: 'user',
                    where: { status: 'ACTIVE' }
                }
            ]
        });
        if (profiles.length === 0) {
            return {
                averageAge: 0,
                minAge: 0,
                maxAge: 0,
                ageGroups: []
            };
        }
        const ages = profiles.map(profile => profile.getAge()).filter(age => age !== null);
        const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        // Age groups
        const ageGroups = [
            { range: '18-25', count: 0 },
            { range: '26-35', count: 0 },
            { range: '36-45', count: 0 },
            { range: '46-55', count: 0 },
            { range: '56+', count: 0 }
        ];
        ages.forEach(age => {
            if (age >= 18 && age <= 25)
                ageGroups[0].count++;
            else if (age >= 26 && age <= 35)
                ageGroups[1].count++;
            else if (age >= 36 && age <= 45)
                ageGroups[2].count++;
            else if (age >= 46 && age <= 55)
                ageGroups[3].count++;
            else if (age >= 56)
                ageGroups[4].count++;
        });
        return {
            averageAge: Math.round(averageAge * 100) / 100,
            minAge,
            maxAge,
            ageGroups
        };
    }
    static async getIncompleteProfiles() {
        const profiles = await this.findAll({
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'username', 'email'],
                    where: { status: 'ACTIVE' }
                }
            ]
        });
        return profiles.filter(profile => !profile.isProfileComplete());
    }
}
exports.UserProfile = UserProfile;
// Initialize the model
UserProfile.init({
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
    fullName: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        field: 'full_name',
        validate: {
            len: [2, 150],
            notEmpty: true
        }
    },
    gender: {
        type: sequelize_1.DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
        defaultValue: 'OTHER',
        allowNull: false,
        validate: {
            isIn: [['MALE', 'FEMALE', 'OTHER']]
        }
    },
    dateOfBirth: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth',
        validate: {
            isDate: true,
            isBefore: new Date().toISOString().split('T')[0], // Must be before today
            isAfter: new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Must be within last 100 years
        }
    },
    avatarUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: 'avatar_url',
        validate: {
            isUrl: {
                msg: 'Avatar URL must be a valid URL'
            },
            len: [0, 255]
        }
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255]
        }
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
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
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['full_name']
        },
        {
            fields: ['gender']
        },
        {
            fields: ['date_of_birth']
        }
    ]
});
exports.default = UserProfile;
//# sourceMappingURL=UserProfile.model.js.map