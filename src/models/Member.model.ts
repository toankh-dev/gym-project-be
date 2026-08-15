import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '@/config/database.config';
import { User } from './User.model';
import { Trainer } from './Trainer.model';

// Member attributes interface
export interface MemberAttributes {
  id: number;
  userId: number;
  memberCode: string;
  joinDate: Date;
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  currentSubscriptionId?: number;
  assignedTrainerId?: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Member creation attributes
export interface MemberCreationAttributes extends Optional<MemberAttributes, 'id' | 'currentSubscriptionId' | 'assignedTrainerId' | 'note' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// MemberProfile attributes interface
export interface MemberProfileAttributes {
  id: number;
  memberId: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  fitnessGoal?: string;
  trainingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  healthCondition?: string;
  medicalNote?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// MemberProfile creation attributes
export interface MemberProfileCreationAttributes extends Optional<MemberProfileAttributes, 'id' | 'heightCm' | 'weightKg' | 'bmi' | 'bodyFatPercent' | 'muscleMassKg' | 'fitnessGoal' | 'healthCondition' | 'medicalNote' | 'emergencyContactName' | 'emergencyContactPhone' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// MemberPreference attributes interface
export interface MemberPreferenceAttributes {
  id: number;
  memberId: number;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  notifyWorkoutReminders: boolean;
  notifySubscriptionExpiry: boolean;
  notifyTrainerMessages: boolean;
  profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  showProgress: boolean;
  showStats: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// MemberPreference creation attributes
export interface MemberPreferenceCreationAttributes extends Optional<MemberPreferenceAttributes, 'id' | 'notifyEmail' | 'notifySms' | 'notifyPush' | 'notifyWorkoutReminders' | 'notifySubscriptionExpiry' | 'notifyTrainerMessages' | 'profileVisibility' | 'showProgress' | 'showStats' | 'createdAt' | 'updatedAt'> {}

// Member model class
export class Member extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
  declare id: number;
  declare userId: number;
  declare memberCode: string;
  declare joinDate: Date;
  declare membershipStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  declare currentSubscriptionId?: number;
  declare assignedTrainerId?: number;
  declare note?: string;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Associations
  public user!: User;
  public assignedTrainer?: Trainer;
  public profile!: MemberProfile;

  // Static associations
  public static associations: {
    user: Association<Member, User>;
    assignedTrainer: Association<Member, Trainer>;
    profile: Association<Member, any>;
  };

  // Instance methods
  public isActive(): boolean {
    return this.membershipStatus === 'ACTIVE';
  }

  public hasAssignedTrainer(): boolean {
    return !!this.assignedTrainerId;
  }

  public getMembershipDuration(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.joinDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }

  public getStatusDisplay(): string {
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

  public getStatusColor(): string {
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
  public static async findByMemberCode(memberCode: string): Promise<Member | null> {
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

  public static async findWithFullDetails(memberId: number): Promise<Member | null> {
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
        },
        {
          association: 'currentSubscription',
          include: [
            {
              association: 'package',
              attributes: ['id', 'name', 'durationMonths', 'price']
            }
          ]
        },
        {
          association: 'subscriptions',
          include: [
            {
              association: 'package',
              attributes: ['id', 'name', 'durationMonths', 'price']
            }
          ]
        }
      ]
    });
  }

  public static async findByStatus(status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'): Promise<Member[]> {
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

  public static async findByTrainer(trainerId: number): Promise<Member[]> {
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

  public static async generateMemberCode(): Promise<string> {
    const prefix = 'M';
    const year = new Date().getFullYear().toString().slice(-2);
    const pattern = `${prefix}${year}`;

    // Find all member codes for this year (including soft-deleted ones)
    const members = await this.findAll({
      where: {
        memberCode: {
          [Op.like]: `${pattern}%`
        }
      },
      attributes: ['memberCode'],
      paranoid: false
    });

    let maxNumber = 0;
    for (const m of members) {
      if (m.memberCode) {
        const numStr = m.memberCode.replace(new RegExp(`^${prefix}${year}`), '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    let nextNumber = maxNumber + 1;
    let newCode = `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;

    // Ensure generated code is guaranteed unique (safety loop)
    while (await this.findOne({ where: { memberCode: newCode }, paranoid: false })) {
      nextNumber++;
      newCode = `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
    }

    return newCode;
  }

  public static async getStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    suspended: number;
    cancelled: number;
    newThisMonth: number;
    withTrainer: number;
  }> {
    const [
      total,
      active,
      expired,
      suspended,
      cancelled,
      withTrainer
    ] = await Promise.all([
      this.count(),
      this.count({ where: { membershipStatus: 'ACTIVE' } }),
      this.count({ where: { membershipStatus: 'EXPIRED' } }),
      this.count({ where: { membershipStatus: 'SUSPENDED' } }),
      this.count({ where: { membershipStatus: 'CANCELLED' } }),
      this.count({
        where: {
          assignedTrainerId: { [Op.not]: null }
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
          [Op.gte]: startOfMonth
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

// MemberProfile model class
export class MemberProfile extends Model<MemberProfileAttributes, MemberProfileCreationAttributes> implements MemberProfileAttributes {
  declare id: number;
  declare memberId: number;
  declare heightCm?: number;
  declare weightKg?: number;
  declare bmi?: number;
  declare bodyFatPercent?: number;
  declare muscleMassKg?: number;
  declare fitnessGoal?: string;
  declare trainingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  declare healthCondition?: string;
  declare medicalNote?: string;
  declare emergencyContactName?: string;
  declare emergencyContactPhone?: string;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Associations
  public member!: Member;

  // Instance methods
  public calculateBMI(): number | null {
    if (!this.heightCm || !this.weightKg) return null;
    const heightM = this.heightCm / 100;
    return parseFloat((this.weightKg / (heightM * heightM)).toFixed(1));
  }

  public getBMICategory(): string | null {
    const bmi = this.bmi || this.calculateBMI();
    if (!bmi) return null;

    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  public getTrainingLevelDisplay(): string {
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

  public hasHealthConditions(): boolean {
    return !!(this.healthCondition || this.medicalNote);
  }

  public hasEmergencyContact(): boolean {
    return !!(this.emergencyContactName && this.emergencyContactPhone);
  }

  public updateBMI(): void {
    this.bmi = this.calculateBMI();
  }
}

// MemberPreference model class
export class MemberPreference extends Model<MemberPreferenceAttributes, MemberPreferenceCreationAttributes> implements MemberPreferenceAttributes {
  declare id: number;
  declare memberId: number;
  declare notifyEmail: boolean;
  declare notifySms: boolean;
  declare notifyPush: boolean;
  declare notifyWorkoutReminders: boolean;
  declare notifySubscriptionExpiry: boolean;
  declare notifyTrainerMessages: boolean;
  declare profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  declare showProgress: boolean;
  declare showStats: boolean;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public member!: Member;
}

// Initialize Member model
Member.init(
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
    memberCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'member_code',
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'join_date',
      defaultValue: DataTypes.NOW
    },
    membershipStatus: {
      type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'),
      defaultValue: 'ACTIVE',
      allowNull: false,
      field: 'membership_status'
    },
    currentSubscriptionId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
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
  }
);

// Initialize MemberProfile model
MemberProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'height_cm',
      validate: {
        min: 50,
        max: 300
      }
    },
    weightKg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'weight_kg',
      validate: {
        min: 20,
        max: 500
      }
    },
    bmi: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 10,
        max: 100
      }
    },
    bodyFatPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'body_fat_percent',
      validate: {
        min: 0,
        max: 100
      }
    },
    muscleMassKg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'muscle_mass_kg',
      validate: {
        min: 0,
        max: 200
      }
    },
    fitnessGoal: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'fitness_goal',
      validate: {
        len: [0, 255]
      }
    },
    trainingLevel: {
      type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
      defaultValue: 'BEGINNER',
      allowNull: false,
      field: 'training_level'
    },
    healthCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'health_condition'
    },
    medicalNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'medical_note'
    },
    emergencyContactName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'emergency_contact_name',
      validate: {
        len: [0, 150]
      }
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_phone',
      validate: {
        len: [0, 20]
      }
    }
  },
  {
    sequelize,
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
      beforeSave: (profile: MemberProfile) => {
        // Auto-calculate BMI if height and weight are provided
        if (profile.heightCm && profile.weightKg) {
          profile.updateBMI();
        }
      }
    }
  }
);

// Initialize MemberPreference model
MemberPreference.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notify_email'
    },
    notifySms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'notify_sms'
    },
    notifyPush: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notify_push'
    },
    notifyWorkoutReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notify_workout_reminders'
    },
    notifySubscriptionExpiry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notify_subscription_expiry'
    },
    notifyTrainerMessages: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notify_trainer_messages'
    },
    profileVisibility: {
      type: DataTypes.ENUM('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'),
      allowNull: false,
      defaultValue: 'MEMBERS_ONLY',
      field: 'profile_visibility'
    },
    showProgress: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'show_progress'
    },
    showStats: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'show_stats'
    }
  },
  {
    sequelize,
    modelName: 'MemberPreference',
    tableName: 'member_preferences',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['member_id'] }
    ]
  }
);

export default { Member, MemberProfile, MemberPreference };