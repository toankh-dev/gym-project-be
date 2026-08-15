"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceLog = exports.ScheduleMember = exports.TrainingSchedule = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("@/config/database.config"));
// TrainingSchedule model class
class TrainingSchedule extends sequelize_1.Model {
    id;
    className;
    trainerId;
    classType;
    description;
    startDate;
    endDate;
    startTime;
    endTime;
    dayOfWeek;
    maxCapacity;
    currentEnrollment;
    pricePerSession;
    location;
    status;
    // Timestamps
    createdAt;
    updatedAt;
    // Associations
    trainer;
    registeredMembers;
    // Instance methods
    isActive() {
        return this.status === 'SCHEDULED';
    }
    isFull() {
        return this.registeredMembers ? this.registeredMembers.length >= this.maxCapacity : false;
    }
    getAvailableSlots() {
        const registered = this.registeredMembers ?
            this.registeredMembers.filter(sm => sm.status === 'REGISTERED').length : 0;
        return this.maxCapacity - registered;
    }
    isInPast() {
        const startDateTime = new Date(`${this.startDate}T${this.startTime}`);
        return startDateTime < new Date();
    }
    canBook() {
        return this.isActive() && !this.isFull() && !this.isInPast();
    }
    getDuration() {
        const start = new Date(`2000-01-01T${this.startTime}`);
        const end = new Date(`2000-01-01T${this.endTime}`);
        return (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
    }
    // Static methods
    static async findByDate(date) {
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
    static async findByTrainer(trainerId, startDate, endDate) {
        const { Op } = require('sequelize');
        const whereClause = { trainerId };
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
    static async getUpcomingSchedules(limit = 10) {
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
exports.TrainingSchedule = TrainingSchedule;
// ScheduleMember model class
class ScheduleMember extends sequelize_1.Model {
    id;
    scheduleId;
    memberId;
    status;
    registeredAt;
    // Timestamps
    createdAt;
    updatedAt;
    // Associations
    schedule;
    member;
    // Instance methods
    isActive() {
        return this.status === 'REGISTERED';
    }
    hasAttended() {
        return this.status === 'ATTENDED';
    }
    // Static methods
    static async findByMember(memberId) {
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
    static async findBySchedule(scheduleId) {
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
exports.ScheduleMember = ScheduleMember;
// AttendanceLog model class
class AttendanceLog extends sequelize_1.Model {
    id;
    memberId;
    scheduleId;
    checkinTime;
    checkoutTime;
    attendanceType;
    // Timestamps
    createdAt;
    updatedAt;
    // Associations
    member;
    schedule;
    // Instance methods
    getDuration() {
        if (!this.checkoutTime)
            return null;
        return Math.floor((this.checkoutTime.getTime() - this.checkinTime.getTime()) / (1000 * 60)); // in minutes
    }
    isCurrentlyCheckedIn() {
        return !this.checkoutTime;
    }
    // Static methods
    static async findByMember(memberId, startDate, endDate) {
        const { Op } = require('sequelize');
        const whereClause = { memberId };
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
    static async getTodayAttendance() {
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
    static async getAttendanceStats(startDate, endDate) {
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
        return stats.map((stat) => ({
            date: stat.getDataValue('date'),
            count: parseInt(stat.getDataValue('count'))
        }));
    }
}
exports.AttendanceLog = AttendanceLog;
// Initialize TrainingSchedule model
TrainingSchedule.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    className: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        field: 'class_name',
        validate: {
            len: [1, 150],
            notEmpty: true
        }
    },
    trainerId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
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
        type: sequelize_1.DataTypes.ENUM('GROUP_CLASS', 'PERSONAL_TRAINING', 'WORKSHOP'),
        allowNull: false,
        field: 'class_type'
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
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
    startTime: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
        field: 'start_time'
    },
    endTime: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
        field: 'end_time'
    },
    dayOfWeek: {
        type: sequelize_1.DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
        allowNull: false,
        field: 'day_of_week'
    },
    maxCapacity: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
        field: 'max_capacity'
    },
    currentEnrollment: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        field: 'current_enrollment'
    },
    pricePerSession: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'price_per_session'
    },
    location: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'SCHEDULED',
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
});
// Initialize ScheduleMember model
ScheduleMember.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    scheduleId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
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
    status: {
        type: sequelize_1.DataTypes.ENUM('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED'),
        defaultValue: 'REGISTERED',
        allowNull: false,
        field: 'attendance_status'
    },
    registeredAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
        field: 'enrollment_date'
    }
}, {
    sequelize: database_config_1.default,
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
});
// Initialize AttendanceLog model
AttendanceLog.init({
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
    scheduleId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
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
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'check_in_time'
    },
    checkoutTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'check_out_time'
    },
    attendanceType: {
        type: sequelize_1.DataTypes.ENUM('GYM_VISIT', 'TRAINING_SESSION', 'GROUP_CLASS'),
        defaultValue: 'GYM_VISIT',
        allowNull: false,
        field: 'attendance_type'
    }
}, {
    sequelize: database_config_1.default,
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
});
exports.default = { TrainingSchedule, ScheduleMember, AttendanceLog };
//# sourceMappingURL=Schedule.model.js.map