import { DataTypes, Model, Optional, } from 'sequelize';
import sequelize from '@/config/database.config';
import { Trainer } from './Trainer.model';
import { Member } from './Member.model';

// TrainingSchedule attributes interface
export interface TrainingScheduleAttributes {
  id: number;
  className: string; // maps to class_name
  trainerId: number;
  classType: 'GROUP_CLASS' | 'PERSONAL_TRAINING' | 'WORKSHOP'; // maps to class_type
  description?: string;
  startDate: Date; // maps to start_date
  endDate: Date; // maps to end_date
  startTime: string; // maps to start_time
  endTime: string; // maps to end_time
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'; // maps to day_of_week
  maxCapacity: number; // maps to max_capacity
  currentEnrollment: number; // maps to current_enrollment
  pricePerSession?: number; // maps to price_per_session
  location?: string; // maps to location
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

// TrainingSchedule creation attributes
export interface TrainingScheduleCreationAttributes extends Optional<TrainingScheduleAttributes, 'id' | 'description' | 'currentEnrollment' | 'pricePerSession' | 'location' | 'createdAt' | 'updatedAt'> {}

// ScheduleMember attributes interface
export interface ScheduleMemberAttributes {
  id: number;
  scheduleId: number;
  memberId: number;
  status: 'REGISTERED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED';
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ScheduleMember creation attributes
export interface ScheduleMemberCreationAttributes extends Optional<ScheduleMemberAttributes, 'id' | 'registeredAt' | 'createdAt' | 'updatedAt'> {}

// AttendanceLog attributes interface
export interface AttendanceLogAttributes {
  id: number;
  memberId: number;
  scheduleId?: number;
  checkinTime: Date;
  checkoutTime?: Date;
  attendanceType: 'GYM_VISIT' | 'TRAINING_SESSION' | 'GROUP_CLASS';
  createdAt: Date;
  updatedAt: Date;
}

// AttendanceLog creation attributes
export interface AttendanceLogCreationAttributes extends Optional<AttendanceLogAttributes, 'id' | 'scheduleId' | 'checkoutTime' | 'createdAt' | 'updatedAt'> {}

// TrainingSchedule model class
export class TrainingSchedule extends Model<TrainingScheduleAttributes, TrainingScheduleCreationAttributes> implements TrainingScheduleAttributes {
  declare id: number;
  declare className: string;
  declare trainerId: number;
  declare classType: 'GROUP_CLASS' | 'PERSONAL_TRAINING' | 'WORKSHOP';
  declare description?: string;
  declare startDate: Date;
  declare endDate: Date;
  declare startTime: string;
  declare endTime: string;
  declare dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  declare maxCapacity: number;
  declare currentEnrollment: number;
  declare pricePerSession?: number;
  declare location?: string;
  declare status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public trainer!: Trainer;
  public registeredMembers!: ScheduleMember[];

  // Instance methods
  public isActive(): boolean {
    return this.status === 'SCHEDULED';
  }

  public isFull(): boolean {
    return this.registeredMembers ? this.registeredMembers.length >= this.maxCapacity : false;
  }

  public getAvailableSlots(): number {
    const registered = this.registeredMembers ?
      this.registeredMembers.filter(sm => sm.status === 'REGISTERED').length : 0;
    return this.maxCapacity - registered;
  }

  public isInPast(): boolean {
    const startDateTime = new Date(`${this.startDate}T${this.startTime}`);
    return startDateTime < new Date();
  }

  public canBook(): boolean {
    return this.isActive() && !this.isFull() && !this.isInPast();
  }

  public getDuration(): number {
    const start = new Date(`2000-01-01T${this.startTime}`);
    const end = new Date(`2000-01-01T${this.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
  }

  // Static methods
  public static async findByDate(date: Date): Promise<TrainingSchedule[]> {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        startDate: {
          [Op.eq]: date
        },
        status: 'SCHEDULED'
      },
      include: [
        {
          association: 'trainer',
          include: [
            {
              association: 'user',
              include: [{ association: 'profile' }]
            }
          ]
        },
        {
          association: 'registeredMembers',
          include: [
            {
              association: 'member',
              include: [
                {
                  association: 'user',
                  include: [{ association: 'profile' }]
                }
              ]
            }
          ]
        }
      ],
      order: [['startTime', 'ASC']]
    });
  }

  public static async findByTrainer(trainerId: number, startDate?: Date, endDate?: Date): Promise<TrainingSchedule[]> {
    const { Op } = require('sequelize');
    const whereClause: any = { trainerId };

    if (startDate && endDate) {
      whereClause.startDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          association: 'registeredMembers',
          include: [
            {
              association: 'member',
              include: [
                {
                  association: 'user',
                  include: [{ association: 'profile' }]
                }
              ]
            }
          ]
        }
      ],
      order: [['startDate', 'ASC'], ['startTime', 'ASC']]
    });
  }

  public static async getUpcomingSchedules(limit: number = 10): Promise<TrainingSchedule[]> {
    const { Op } = require('sequelize');
    const now = new Date();

    return this.findAll({
      where: {
        startDate: {
          [Op.gte]: now
        },
        status: 'SCHEDULED'
      },
      include: [
        {
          association: 'trainer',
          include: [
            {
              association: 'user',
              include: [{ association: 'profile' }]
            }
          ]
        }
      ],
      order: [['startDate', 'ASC'], ['startTime', 'ASC']],
      limit
    });
  }
}

// ScheduleMember model class
export class ScheduleMember extends Model<ScheduleMemberAttributes, ScheduleMemberCreationAttributes> implements ScheduleMemberAttributes {
  declare id: number;
  declare scheduleId: number;
  declare memberId: number;
  declare status: 'REGISTERED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED';
  declare registeredAt: Date;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public schedule!: TrainingSchedule;
  public member!: Member;

  // Instance methods
  public isActive(): boolean {
    return this.status === 'REGISTERED';
  }

  public hasAttended(): boolean {
    return this.status === 'ATTENDED';
  }

  // Static methods
  public static async findByMember(memberId: number): Promise<ScheduleMember[]> {
    return this.findAll({
      where: { memberId },
      include: [
        {
          association: 'schedule',
          include: [
            {
              association: 'trainer',
              include: [
                {
                  association: 'user',
                  include: [{ association: 'profile' }]
                }
              ]
            }
          ]
        }
      ],
      order: [['registeredAt', 'DESC']]
    });
  }

  public static async findBySchedule(scheduleId: number): Promise<ScheduleMember[]> {
    return this.findAll({
      where: { scheduleId },
      include: [
        {
          association: 'member',
          include: [
            {
              association: 'user',
              include: [{ association: 'profile' }]
            }
          ]
        }
      ],
      order: [['registeredAt', 'ASC']]
    });
  }
}

// AttendanceLog model class
export class AttendanceLog extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes> implements AttendanceLogAttributes {
  declare id: number;
  declare memberId: number;
  declare scheduleId?: number;
  declare checkinTime: Date;
  declare checkoutTime?: Date;
  declare attendanceType: 'GYM_VISIT' | 'TRAINING_SESSION' | 'GROUP_CLASS';

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public member!: Member;
  public schedule?: TrainingSchedule;

  // Instance methods
  public getDuration(): number | null {
    if (!this.checkoutTime) return null;
    return Math.floor((this.checkoutTime.getTime() - this.checkinTime.getTime()) / (1000 * 60)); // in minutes
  }

  public isCurrentlyCheckedIn(): boolean {
    return !this.checkoutTime;
  }

  // Static methods
  public static async findByMember(memberId: number, startDate?: Date, endDate?: Date): Promise<AttendanceLog[]> {
    const { Op } = require('sequelize');
    const whereClause: any = { memberId };

    if (startDate && endDate) {
      whereClause.checkinTime = {
        [Op.between]: [startDate, endDate]
      };
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          association: 'schedule',
          include: [
            {
              association: 'trainer',
              include: [
                {
                  association: 'user',
                  include: [{ association: 'profile' }]
                }
              ]
            }
          ]
        }
      ],
      order: [['checkinTime', 'DESC']]
    });
  }

  public static async getTodayAttendance(): Promise<AttendanceLog[]> {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findAll({
      where: {
        checkinTime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        {
          association: 'member',
          include: [
            {
              association: 'user',
              include: [{ association: 'profile' }]
            }
          ]
        }
      ],
      order: [['checkinTime', 'DESC']]
    });
  }

  public static async getAttendanceStats(startDate: Date, endDate: Date): Promise<any> {
    const { Op, fn, col } = require('sequelize');

    const stats = await this.findAll({
      where: {
        checkinTime: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [fn('DATE', col('check_in_time')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('check_in_time'))],
      order: [[fn('DATE', col('check_in_time')), 'ASC']]
    });

    return stats.map((stat: any) => ({
      date: stat.getDataValue('date'),
      count: parseInt(stat.getDataValue('count'))
    }));
  }
}

// Initialize TrainingSchedule model
TrainingSchedule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    className: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'class_name',
      validate: {
        len: [1, 150],
        notEmpty: true
      }
    },
    trainerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'trainer_id',
      references: {
        model: 'trainers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    classType: {
      type: DataTypes.ENUM('GROUP_CLASS', 'PERSONAL_TRAINING', 'WORKSHOP'),
      allowNull: false,
      field: 'class_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time'
    },
    dayOfWeek: {
      type: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
      allowNull: false,
      field: 'day_of_week'
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      field: 'max_capacity'
    },
    currentEnrollment: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'current_enrollment'
    },
    pricePerSession: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'price_per_session'
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'SCHEDULED',
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'TrainingSchedule',
    tableName: 'training_schedules',
    timestamps: true,
    paranoid: false, // Disable soft deletes for schedules
    underscored: true,
    indexes: [
      { fields: ['trainer_id'] },
      { fields: ['start_date'] },
      { fields: ['status'] },
      { fields: ['class_type'] },
      { fields: ['trainer_id', 'start_date'] }
    ]
  }
);

// Initialize ScheduleMember model
ScheduleMember.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    scheduleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'schedule_id',
      references: {
        model: 'training_schedules',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    status: {
      type: DataTypes.ENUM('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED'),
      defaultValue: 'REGISTERED',
      allowNull: false,
      field: 'attendance_status'
    },
    registeredAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'enrollment_date'
    }
  },
  {
    sequelize,
    modelName: 'ScheduleMember',
    tableName: 'schedule_members',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes
    indexes: [
      { fields: ['schedule_id'] },
      { fields: ['member_id'] },
      { fields: ['attendance_status'] },
      { unique: true, fields: ['schedule_id', 'member_id'] }
    ]
  }
);

// Initialize AttendanceLog model
AttendanceLog.init(
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
    scheduleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'schedule_id',
      references: {
        model: 'training_schedules',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    checkinTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'check_in_time'
    },
    checkoutTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_out_time'
    },
    attendanceType: {
      type: DataTypes.ENUM('GYM_VISIT', 'TRAINING_SESSION', 'GROUP_CLASS'),
      defaultValue: 'GYM_VISIT',
      allowNull: false,
      field: 'attendance_type'
    }
  },
  {
    sequelize,
    modelName: 'AttendanceLog',
    tableName: 'attendance_logs',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes
    indexes: [
      { fields: ['member_id'] },
      { fields: ['schedule_id'] },
      { fields: ['check_in_time'] }
    ]
  }
);

export default { TrainingSchedule, ScheduleMember, AttendanceLog };