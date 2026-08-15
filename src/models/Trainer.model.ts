import { DataTypes, Model, Optional, } from 'sequelize';
import sequelize from '@/config/database.config';
import { User } from './User.model';

// Trainer attributes interface
export interface TrainerAttributes {
  id: number;
  userId: number;
  trainerCode: string;
  experienceYears: number;
  ratingAvg: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Trainer creation attributes
export interface TrainerCreationAttributes extends Optional<TrainerAttributes, 'id' | 'experienceYears' | 'ratingAvg' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// TrainerProfile attributes interface
export interface TrainerProfileAttributes {
  id: number;
  trainerId: number;
  certificate?: string;
  certificatesDetail?: string;
  education?: string;
  skills?: string;
  workExperience?: string;
  introduction?: string;
  trainingPhilosophy?: string;
  achievements?: string;
  availableTime?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// TrainerProfile creation attributes
export interface TrainerProfileCreationAttributes extends Optional<TrainerProfileAttributes, 'id' | 'certificate' | 'certificatesDetail' | 'education' | 'skills' | 'workExperience' | 'introduction' | 'trainingPhilosophy' | 'achievements' | 'availableTime' | 'facebookUrl' | 'instagramUrl' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// Specialization attributes interface
export interface SpecializationAttributes {
  id: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

// Specialization creation attributes
export interface SpecializationCreationAttributes extends Optional<SpecializationAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

// Trainer model class
export class Trainer extends Model<TrainerAttributes, TrainerCreationAttributes> implements TrainerAttributes {
  declare id: number;
  declare userId: number;
  declare trainerCode: string;
  declare experienceYears: number;
  declare ratingAvg: number;
  declare status: 'ACTIVE' | 'INACTIVE';

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Associations
  public user!: User;
  public profile!: TrainerProfile;
  public specializations!: Specialization[];
  public assignedMembers?: any[];

  // Static associations
  public static associations: {
    user: Association<Trainer, User>;
    profile: Association<Trainer, any>;
    specializations: Association<Trainer, any>;
  };

  // Instance methods
  public isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  public getExperienceLevel(): string {
    if (this.experienceYears < 2) return 'Junior';
    if (this.experienceYears < 5) return 'Mid-level';
    if (this.experienceYears < 10) return 'Senior';
    return 'Expert';
  }

  public getRatingDisplay(): string {
    return `${this.ratingAvg.toFixed(1)}/5.0`;
  }

  public getRatingStars(): number {
    return Math.round(this.ratingAvg);
  }

  public hasSpecializations(): boolean {
    return this.specializations && this.specializations.length > 0;
  }

  public getSpecializationNames(): string[] {
    return this.specializations ? this.specializations.map(s => s.name) : [];
  }

  public getStatusColor(): string {
    return this.status === 'ACTIVE' ? 'success' : 'default';
  }

  // Static methods
  public static async findByTrainerCode(trainerCode: string): Promise<Trainer | null> {
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

  public static async findWithFullDetails(trainerId: number): Promise<Trainer | null> {
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

  public static async findActiveTrainers(): Promise<Trainer[]> {
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

  public static async findBySpecialization(specializationId: number): Promise<Trainer[]> {
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

  public static async generateTrainerCode(): Promise<string> {
    const prefix = 'T';
    const year = new Date().getFullYear().toString().slice(-2);
    const pattern = `${prefix}${year}`;

    // Find all trainer codes for this year (including soft-deleted ones)
    const trainers = await this.findAll({
      where: {
        trainerCode: {
          [Op.like]: `${pattern}%`
        }
      },
      attributes: ['trainerCode'],
      paranoid: false
    });

    let maxNumber = 0;
    for (const t of trainers) {
      if (t.trainerCode) {
        const numStr = t.trainerCode.replace(new RegExp(`^${pattern}`), '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    let nextNumber = maxNumber + 1;
    let newCode = `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;

    // Ensure generated code is guaranteed unique (safety loop)
    while (await this.findOne({ where: { trainerCode: newCode }, paranoid: false })) {
      nextNumber++;
      newCode = `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
    }

    return newCode;
  }

  public static async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageRating: number;
    averageExperience: number;
    newThisMonth: number;
    topRated: Trainer[];
  }> {
    const [
      total,
      active,
      inactive
    ] = await Promise.all([
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
          [Op.gte]: startOfMonth
        }
      } as any
    });

    // Top rated trainers
    const topRated = await this.findAll({
      where: {
        status: 'ACTIVE',
        ratingAvg: { [Op.gte]: 4.0 }
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

// TrainerProfile model class
export class TrainerProfile extends Model<TrainerProfileAttributes, TrainerProfileCreationAttributes> implements TrainerProfileAttributes {
  declare id: number;
  declare trainerId: number;
  declare certificate?: string;
  declare certificatesDetail?: string;
  declare education?: string;
  declare skills?: string;
  declare workExperience?: string;
  declare introduction?: string;
  declare trainingPhilosophy?: string;
  declare achievements?: string;
  declare availableTime?: string;
  declare facebookUrl?: string;
  declare instagramUrl?: string;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Associations
  public trainer!: Trainer;

  // Instance methods
  public hasCertificates(): boolean {
    return !!(this.certificate || this.certificatesDetail);
  }

  public hasWorkExperience(): boolean {
    return !!this.workExperience;
  }

  public hasSocialMedia(): boolean {
    return !!(this.facebookUrl || this.instagramUrl);
  }

  public getSkillsArray(): string[] {
    if (!this.skills) return [];
    return this.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  }

  public isProfileComplete(): boolean {
    return !!(
      this.introduction &&
      this.skills &&
      this.trainingPhilosophy &&
      this.availableTime
    );
  }

  public getCompletionPercentage(): number {
    let completedFields = 0;
    const totalFields = 8; // certificate, education, skills, workExperience, introduction, trainingPhilosophy, achievements, availableTime

    if (this.certificate) completedFields++;
    if (this.education) completedFields++;
    if (this.skills) completedFields++;
    if (this.workExperience) completedFields++;
    if (this.introduction) completedFields++;
    if (this.trainingPhilosophy) completedFields++;
    if (this.achievements) completedFields++;
    if (this.availableTime) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }
}

// Specialization model class
export class Specialization extends Model<SpecializationAttributes, SpecializationCreationAttributes> implements SpecializationAttributes {
  declare id: number;
  declare name: string;
  declare description?: string;
  declare status: 'ACTIVE' | 'INACTIVE';

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  // Static methods
  public static async findActiveSpecializations(): Promise<Specialization[]> {
    return this.findAll({
      where: { status: 'ACTIVE' },
      order: [['name', 'ASC']]
    });
  }

  public static async findByName(name: string): Promise<Specialization | null> {
    return this.findOne({
      where: { name }
    });
  }

  public static async getPopularSpecializations(limit: number = 10): Promise<any[]> {
    // This would typically join with trainer_specializations to count usage
    return this.findAll({
      where: { status: 'ACTIVE' },
      order: [['name', 'ASC']],
      limit
    });
  }
}

// Initialize Trainer model
Trainer.init(
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
    trainerCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'trainer_code',
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'experience_years',
      validate: {
        min: 0,
        max: 50
      }
    },
    ratingAvg: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'rating_avg',
      validate: {
        min: 0,
        max: 5
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
      allowNull: false
    }
  },
  {
    sequelize,
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
  }
);

// Initialize TrainerProfile model
TrainerProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    trainerId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    certificatesDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'certificates_detail'
    },
    education: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    workExperience: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'work_experience'
    },
    introduction: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    trainingPhilosophy: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'training_philosophy'
    },
    achievements: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    availableTime: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'available_time'
    },
    facebookUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'facebook_url',
      validate: {
        isUrl: true,
        len: [0, 255]
      }
    },
    instagramUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'instagram_url'
    }
  },
  {
    sequelize,
    modelName: 'TrainerProfile',
    tableName: 'trainer_profiles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['trainer_id'] }
    ]
  }
);

// Initialize Specialization model
Specialization.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Specialization',
    tableName: 'specializations',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for specializations
    indexes: [
      { fields: ['name'] },
      { fields: ['status'] }
    ]
  }
);

export default { Trainer, TrainerProfile, Specialization };