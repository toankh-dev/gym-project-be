import { DataTypes, Model, Optional, } from 'sequelize';
import sequelize from '@/config/database.config';
import { Member } from './Member.model';
import { User } from './User.model';

// MembershipPackage attributes interface
export interface MembershipPackageAttributes {
  id: number;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  benefits?: string;
  maxSessions?: number;
  allowTrainer: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

// MemberSubscription attributes interface
export interface MemberSubscriptionAttributes {
  id: number;
  memberId: number;
  packageId: number;
  startDate: Date;
  endDate: Date;
  actualPrice: number;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  renewalReminderSent: boolean;
  renewalReminderSentAt?: Date;
  registeredBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Creation attributes
export interface MembershipPackageCreationAttributes extends Optional<MembershipPackageAttributes, 'id' | 'description' | 'benefits' | 'maxSessions' | 'createdAt' | 'updatedAt'> {}
export interface MemberSubscriptionCreationAttributes extends Optional<MemberSubscriptionAttributes, 'id' | 'renewalReminderSent' | 'renewalReminderSentAt' | 'registeredBy' | 'createdAt' | 'updatedAt'> {}

// MembershipPackage model
export class MembershipPackage extends Model<MembershipPackageAttributes, MembershipPackageCreationAttributes> implements MembershipPackageAttributes {
  declare id: number;
  declare name: string;
  declare durationMonths: number;
  declare price: number;
  declare description?: string;
  declare benefits?: string;
  declare maxSessions?: number;
  declare allowTrainer: boolean;
  declare status: 'ACTIVE' | 'INACTIVE';

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  public getMonthlyPrice(): number {
    return this.price / this.durationMonths;
  }
}

// MemberSubscription model
export class MemberSubscription extends Model<MemberSubscriptionAttributes, MemberSubscriptionCreationAttributes> implements MemberSubscriptionAttributes {
  declare id: number;
  declare memberId: number;
  declare packageId: number;
  declare startDate: Date;
  declare endDate: Date;
  declare actualPrice: number;
  declare status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  declare renewalReminderSent: boolean;
  declare renewalReminderSentAt?: Date;
  declare registeredBy?: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public member?: Member;
  public package?: MembershipPackage;
  public registeredByUser?: User;

  // Instance methods
  public isActive(): boolean {
    const now = new Date();
    return this.status === 'ACTIVE' && this.endDate >= now;
  }

  public isExpired(): boolean {
    const now = new Date();
    return this.endDate < now;
  }

  public getDaysRemaining(): number {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Initialize MembershipPackage model
MembershipPackage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_months'
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maxSessions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_sessions'
    },
    allowTrainer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'allow_trainer'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'MembershipPackage',
    tableName: 'membership_packages',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for packages
  }
);

// Initialize MemberSubscription model
MemberSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date'
    },
    actualPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'actual_price'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'),
      defaultValue: 'PENDING',
      allowNull: false
    },
    renewalReminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'renewal_reminder_sent'
    },
    renewalReminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'renewal_reminder_sent_at'
    },
    registeredBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'registered_by',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  },
  {
    sequelize,
    modelName: 'MemberSubscription',
    tableName: 'member_subscriptions',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for subscriptions
  }
);

// MembershipPackage and MemberSubscription are already exported at their class definitions