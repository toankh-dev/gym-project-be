import { DataTypes, Model, Optional, } from 'sequelize';
import sequelize from '@/config/database.config';
import { User } from './User.model';

// UserProfile attributes interface
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

// UserProfile creation attributes
export interface UserProfileCreationAttributes extends Optional<UserProfileAttributes, 'id' | 'dateOfBirth' | 'avatarUrl' | 'address' | 'bio' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// UserProfile model class
export class UserProfile extends Model<UserProfileAttributes, UserProfileCreationAttributes> implements UserProfileAttributes {
  declare id: number;
  declare userId: number;
  declare fullName: string;
  declare gender: 'MALE' | 'FEMALE' | 'OTHER';
  declare dateOfBirth?: Date;
  declare avatarUrl?: string;
  declare address?: string;
  declare bio?: string;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Associations
  public user!: User;

  // Static associations
  public static associations: {
    user: Association<UserProfile, User>;
  };

  // Instance methods
  public getAge(): number | null {
    if (!this.dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  public getDisplayName(): string {
    return this.fullName || `User #${this.userId}`;
  }

  public getGenderDisplay(): string {
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

  public hasAvatar(): boolean {
    return !!this.avatarUrl;
  }

  public getAvatarUrl(): string {
    return this.avatarUrl || '/uploads/avatars/default-avatar.png';
  }

  public isProfileComplete(): boolean {
    return !!(this.fullName && this.gender && this.dateOfBirth);
  }

  public getCompletionPercentage(): number {
    let completedFields = 0;
    const totalFields = 6; // fullName, gender, dateOfBirth, avatarUrl, address, bio

    if (this.fullName) completedFields++;
    if (this.gender) completedFields++;
    if (this.dateOfBirth) completedFields++;
    if (this.avatarUrl) completedFields++;
    if (this.address) completedFields++;
    if (this.bio) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  // Static methods
  public static async findByUserId(userId: number): Promise<UserProfile | null> {
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

  public static async findWithUser(profileId: number): Promise<UserProfile | null> {
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

  public static async searchProfiles(searchTerm: string, limit: number = 10): Promise<UserProfile[]> {
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

  public static async getProfilesByGender(gender: 'MALE' | 'FEMALE' | 'OTHER'): Promise<UserProfile[]> {
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

  public static async getAgeStatistics(): Promise<{
    averageAge: number;
    minAge: number;
    maxAge: number;
    ageGroups: { range: string; count: number }[];
  }> {
    const profiles = await this.findAll({
      where: {
        dateOfBirth: {
          [Op.not]: null
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

    const ages = profiles.map(profile => profile.getAge()).filter(age => age !== null) as number[];

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
      if (age >= 18 && age <= 25) ageGroups[0].count++;
      else if (age >= 26 && age <= 35) ageGroups[1].count++;
      else if (age >= 36 && age <= 45) ageGroups[2].count++;
      else if (age >= 46 && age <= 55) ageGroups[3].count++;
      else if (age >= 56) ageGroups[4].count++;
    });

    return {
      averageAge: Math.round(averageAge * 100) / 100,
      minAge,
      maxAge,
      ageGroups
    };
  }

  public static async getIncompleteProfiles(): Promise<UserProfile[]> {
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

// Initialize the model
UserProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'full_name',
      validate: {
        len: [2, 150],
        notEmpty: true
      }
    },
    gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
      defaultValue: 'OTHER',
      allowNull: false,
      validate: {
        isIn: [['MALE', 'FEMALE', 'OTHER']]
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
      validate: {
        isValidDateOfBirth(value: any) {
          if (!value) return;
          const dob = new Date(value);
          if (isNaN(dob.getTime())) {
            throw new Error('Date of birth must be a valid date');
          }
          const today = new Date();
          if (dob >= today) {
            throw new Error('Date of birth must be before today');
          }
          const hundredYearsAgo = new Date();
          hundredYearsAgo.setFullYear(today.getFullYear() - 100);
          if (dob < hundredYearsAgo) {
            throw new Error('Date of birth must be within the last 100 years');
          }
        }
      }
    },
    avatarUrl: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    }
  },
  {
    sequelize,
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
  }
);

export default UserProfile;