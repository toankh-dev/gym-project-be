"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateParamSchema = exports.trainerIdParamSchema = exports.memberIdParamSchema = exports.scheduleIdParamSchema = exports.getAttendanceStatsSchema = exports.getAttendanceLogsSchema = exports.getSchedulesSchema = exports.checkOutMemberSchema = exports.checkInMemberSchema = exports.registerForScheduleSchema = exports.updateTrainingScheduleSchema = exports.createTrainingScheduleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Training Schedule Validation Schemas
exports.createTrainingScheduleSchema = joi_1.default.object({
    title: joi_1.default.string()
        .trim()
        .min(3)
        .max(150)
        .required()
        .messages({
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title must not exceed 150 characters'
    }),
    trainerId: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Trainer ID must be a number',
        'number.positive': 'Trainer ID must be positive',
        'any.required': 'Trainer ID is required'
    }),
    scheduleDate: joi_1.default.date()
        .min('now')
        .required()
        .messages({
        'date.base': 'Schedule date must be a valid date',
        'date.min': 'Schedule date cannot be in the past',
        'any.required': 'Schedule date is required'
    }),
    startTime: joi_1.default.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
        'string.pattern.base': 'Start time must be in HH:MM format',
        'any.required': 'Start time is required'
    }),
    endTime: joi_1.default.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
        'string.pattern.base': 'End time must be in HH:MM format',
        'any.required': 'End time is required'
    }),
    room: joi_1.default.string()
        .trim()
        .max(100)
        .allow('')
        .optional()
        .messages({
        'string.max': 'Room name must not exceed 100 characters'
    }),
    maxMembers: joi_1.default.number()
        .integer()
        .min(1)
        .max(50)
        .default(1)
        .messages({
        'number.base': 'Max members must be a number',
        'number.min': 'Max members must be at least 1',
        'number.max': 'Max members must not exceed 50'
    }),
    scheduleType: joi_1.default.string()
        .valid('PERSONAL', 'GROUP')
        .default('PERSONAL')
        .messages({
        'any.only': 'Schedule type must be either PERSONAL or GROUP'
    }),
    description: joi_1.default.string()
        .trim()
        .max(1000)
        .allow('')
        .optional()
        .messages({
        'string.max': 'Description must not exceed 1000 characters'
    })
}).custom((value, helpers) => {
    // Validate that end time is after start time
    const startTime = value.startTime.split(':').map(Number);
    const endTime = value.endTime.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];
    if (endMinutes <= startMinutes) {
        return helpers.error('custom.endTimeAfterStart');
    }
    return value;
}, 'Time validation')
    .messages({
    'custom.endTimeAfterStart': 'End time must be after start time'
});
exports.updateTrainingScheduleSchema = joi_1.default.object({
    title: joi_1.default.string()
        .trim()
        .min(3)
        .max(150)
        .optional()
        .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title must not exceed 150 characters'
    }),
    trainerId: joi_1.default.number()
        .integer()
        .positive()
        .optional()
        .messages({
        'number.base': 'Trainer ID must be a number',
        'number.positive': 'Trainer ID must be positive'
    }),
    scheduleDate: joi_1.default.date()
        .min('now')
        .optional()
        .messages({
        'date.base': 'Schedule date must be a valid date',
        'date.min': 'Schedule date cannot be in the past'
    }),
    startTime: joi_1.default.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
        'string.pattern.base': 'Start time must be in HH:MM format'
    }),
    endTime: joi_1.default.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
        'string.pattern.base': 'End time must be in HH:MM format'
    }),
    room: joi_1.default.string()
        .trim()
        .max(100)
        .allow('')
        .optional()
        .messages({
        'string.max': 'Room name must not exceed 100 characters'
    }),
    maxMembers: joi_1.default.number()
        .integer()
        .min(1)
        .max(50)
        .optional()
        .messages({
        'number.base': 'Max members must be a number',
        'number.min': 'Max members must be at least 1',
        'number.max': 'Max members must not exceed 50'
    }),
    scheduleType: joi_1.default.string()
        .valid('PERSONAL', 'GROUP')
        .optional()
        .messages({
        'any.only': 'Schedule type must be either PERSONAL or GROUP'
    }),
    status: joi_1.default.string()
        .valid('SCHEDULED', 'COMPLETED', 'CANCELLED')
        .optional()
        .messages({
        'any.only': 'Status must be SCHEDULED, COMPLETED, or CANCELLED'
    }),
    description: joi_1.default.string()
        .trim()
        .max(1000)
        .allow('')
        .optional()
        .messages({
        'string.max': 'Description must not exceed 1000 characters'
    })
}).custom((value, helpers) => {
    // Validate that end time is after start time if both are provided
    if (value.startTime && value.endTime) {
        const startTime = value.startTime.split(':').map(Number);
        const endTime = value.endTime.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        if (endMinutes <= startMinutes) {
            return helpers.error('custom.endTimeAfterStart');
        }
    }
    return value;
}, 'Time validation')
    .messages({
    'custom.endTimeAfterStart': 'End time must be after start time'
});
// Schedule Registration Validation Schemas
exports.registerForScheduleSchema = joi_1.default.object({
    memberId: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Member ID must be a number',
        'number.positive': 'Member ID must be positive',
        'any.required': 'Member ID is required'
    })
});
// Attendance Validation Schemas
exports.checkInMemberSchema = joi_1.default.object({
    memberId: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Member ID must be a number',
        'number.positive': 'Member ID must be positive',
        'any.required': 'Member ID is required'
    }),
    scheduleId: joi_1.default.number()
        .integer()
        .positive()
        .optional()
        .messages({
        'number.base': 'Schedule ID must be a number',
        'number.positive': 'Schedule ID must be positive'
    }),
    attendanceType: joi_1.default.string()
        .valid('ONLINE', 'OFFLINE')
        .default('ONLINE')
        .messages({
        'any.only': 'Attendance type must be either ONLINE or OFFLINE'
    })
});
exports.checkOutMemberSchema = joi_1.default.object({
    note: joi_1.default.string()
        .trim()
        .max(1000)
        .allow('')
        .optional()
        .messages({
        'string.max': 'Note must not exceed 1000 characters'
    })
});
// Query Parameter Validation Schemas
exports.getSchedulesSchema = joi_1.default.object({
    page: joi_1.default.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
    }),
    trainerId: joi_1.default.number()
        .integer()
        .positive()
        .optional()
        .messages({
        'number.base': 'Trainer ID must be a number',
        'number.positive': 'Trainer ID must be positive'
    }),
    date: joi_1.default.date()
        .iso()
        .optional()
        .messages({
        'date.base': 'Date must be a valid date',
        'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
    }),
    startDate: joi_1.default.date()
        .iso()
        .optional()
        .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
    endDate: joi_1.default.date()
        .iso()
        .min(joi_1.default.ref('startDate'))
        .optional()
        .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
        'date.min': 'End date must be after start date'
    }),
    status: joi_1.default.string()
        .valid('SCHEDULED', 'COMPLETED', 'CANCELLED')
        .optional()
        .messages({
        'any.only': 'Status must be SCHEDULED, COMPLETED, or CANCELLED'
    }),
    scheduleType: joi_1.default.string()
        .valid('PERSONAL', 'GROUP')
        .optional()
        .messages({
        'any.only': 'Schedule type must be either PERSONAL or GROUP'
    })
});
exports.getAttendanceLogsSchema = joi_1.default.object({
    page: joi_1.default.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
    }),
    memberId: joi_1.default.number()
        .integer()
        .positive()
        .optional()
        .messages({
        'number.base': 'Member ID must be a number',
        'number.positive': 'Member ID must be positive'
    }),
    startDate: joi_1.default.date()
        .iso()
        .optional()
        .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
    endDate: joi_1.default.date()
        .iso()
        .min(joi_1.default.ref('startDate'))
        .optional()
        .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
        'date.min': 'End date must be after start date'
    }),
    attendanceType: joi_1.default.string()
        .valid('ONLINE', 'OFFLINE')
        .optional()
        .messages({
        'any.only': 'Attendance type must be either ONLINE or OFFLINE'
    }),
    status: joi_1.default.string()
        .valid('CHECKED_IN', 'CHECKED_OUT', 'ABSENT')
        .optional()
        .messages({
        'any.only': 'Status must be CHECKED_IN, CHECKED_OUT, or ABSENT'
    })
});
exports.getAttendanceStatsSchema = joi_1.default.object({
    startDate: joi_1.default.date()
        .iso()
        .required()
        .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
        'any.required': 'Start date is required'
    }),
    endDate: joi_1.default.date()
        .iso()
        .min(joi_1.default.ref('startDate'))
        .required()
        .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required'
    })
});
// Parameter Validation Schemas
exports.scheduleIdParamSchema = joi_1.default.object({
    id: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Schedule ID must be a number',
        'number.positive': 'Schedule ID must be positive',
        'any.required': 'Schedule ID is required'
    })
});
exports.memberIdParamSchema = joi_1.default.object({
    memberId: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Member ID must be a number',
        'number.positive': 'Member ID must be positive',
        'any.required': 'Member ID is required'
    })
});
exports.trainerIdParamSchema = joi_1.default.object({
    trainerId: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Trainer ID must be a number',
        'number.positive': 'Trainer ID must be positive',
        'any.required': 'Trainer ID is required'
    })
});
exports.dateParamSchema = joi_1.default.object({
    date: joi_1.default.date()
        .iso()
        .required()
        .messages({
        'date.base': 'Date must be a valid date',
        'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
        'any.required': 'Date is required'
    })
});
//# sourceMappingURL=schedule.validation.js.map