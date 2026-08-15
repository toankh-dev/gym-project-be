"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = exports.formatValidationErrors = exports.commonValidationRules = exports.customValidations = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const error_middleware_1 = require("@/middlewares/error.middleware");
// Validation middleware to handle express-validator results
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error) => ({
            field: error.type === 'field' ? error.path : undefined,
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined,
            location: error.location || 'body'
        }));
        const errorMessage = validationErrors
            .map(err => `${err.field}: ${err.message}`)
            .join(', ');
        throw error_middleware_1.createError.validation(`Validation failed: ${errorMessage}`, validationErrors);
    }
    next();
};
exports.validateRequest = validateRequest;
// Custom validation helpers
exports.customValidations = {
    // Check if value is a valid MySQL date
    isValidDate: (value) => {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
    },
    // Check if value is a valid phone number (basic validation)
    isValidPhone: (value) => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        return phoneRegex.test(value);
    },
    // Check if value is a valid time format (HH:MM)
    isValidTime: (value) => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(value);
    },
    // Check if end time is after start time
    isEndTimeAfterStartTime: (startTime, endTime) => {
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        return end > start;
    },
    // Check if date is in the future
    isFutureDate: (value) => {
        const date = new Date(value);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset time to start of day
        return date >= now;
    },
    // Check if date is within a reasonable range (e.g., birth date)
    isBirthDateValid: (value) => {
        const date = new Date(value);
        const now = new Date();
        const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
        const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate()); // 13 years ago
        return date >= minDate && date <= maxDate;
    },
    // Check if password meets security requirements
    isStrongPassword: (password) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(password);
    },
    // Check if email is from allowed domains (optional)
    isAllowedEmailDomain: (email, allowedDomains = []) => {
        if (allowedDomains.length === 0)
            return true;
        const domain = email.split('@')[1]?.toLowerCase();
        return allowedDomains.includes(domain);
    },
    // Check if username is available (placeholder - would check database)
    isUsernameAvailable: async (username) => {
        // This would typically check the database
        // For now, just return true as a placeholder
        return true;
    },
    // Check if email is available (placeholder - would check database)
    isEmailAvailable: async (email) => {
        // This would typically check the database
        // For now, just return true as a placeholder
        return true;
    },
    // Check if value is a valid currency amount
    isValidAmount: (value, min = 0, max = 999999999) => {
        return value >= min && value <= max && Number.isFinite(value);
    },
    // Check if array has unique values
    hasUniqueValues: (array) => {
        return new Set(array).size === array.length;
    },
    // Check if string contains only allowed characters
    hasAllowedCharacters: (value, allowedPattern) => {
        return allowedPattern.test(value);
    },
    // Check if file type is allowed
    isAllowedFileType: (filename, allowedTypes) => {
        const extension = filename.toLowerCase().split('.').pop();
        return allowedTypes.includes(extension || '');
    },
    // Check if file size is within limits
    isFileSizeValid: (size, maxSize = 10 * 1024 * 1024) => {
        return size <= maxSize;
    }
};
// Common validation rules that can be reused
exports.commonValidationRules = {
    // ID parameter validation
    idParam: {
        in: ['params'],
        isInt: {
            options: { min: 1 },
            errorMessage: 'ID must be a positive integer'
        },
        toInt: true
    },
    // Pagination validation
    page: {
        in: ['query'],
        optional: true,
        isInt: {
            options: { min: 1 },
            errorMessage: 'Page must be a positive integer'
        },
        toInt: true
    },
    limit: {
        in: ['query'],
        optional: true,
        isInt: {
            options: { min: 1, max: 100 },
            errorMessage: 'Limit must be between 1 and 100'
        },
        toInt: true
    },
    // Sorting validation
    sortBy: {
        in: ['query'],
        optional: true,
        isString: true,
        trim: true
    },
    sortOrder: {
        in: ['query'],
        optional: true,
        isIn: {
            options: [['asc', 'desc', 'ASC', 'DESC']],
            errorMessage: 'Sort order must be asc or desc'
        }
    },
    // Search validation
    search: {
        in: ['query'],
        optional: true,
        isString: true,
        trim: true,
        isLength: {
            options: { min: 1, max: 100 },
            errorMessage: 'Search term must be between 1 and 100 characters'
        }
    },
    // Date range validation
    startDate: {
        in: ['query'],
        optional: true,
        isISO8601: {
            errorMessage: 'Start date must be a valid ISO 8601 date'
        }
    },
    endDate: {
        in: ['query'],
        optional: true,
        isISO8601: {
            errorMessage: 'End date must be a valid ISO 8601 date'
        }
    },
    // Status validation
    status: {
        in: ['query'],
        optional: true,
        isString: true,
        trim: true
    }
};
// Validation error formatter
const formatValidationErrors = (errors) => {
    return errors.map(error => {
        if (error.type === 'field') {
            return {
                field: error.path,
                message: error.msg,
                value: error.value,
                location: error.location
            };
        }
        else {
            return {
                message: error.msg,
                location: error.location
            };
        }
    });
};
exports.formatValidationErrors = formatValidationErrors;
// Sanitization helpers
exports.sanitize = {
    // Remove HTML tags and trim whitespace
    cleanString: (value) => {
        return value.replace(/<[^>]*>/g, '').trim();
    },
    // Escape special characters for database
    escapeSpecialChars: (value) => {
        return value.replace(/['"\\]/g, '\\$&');
    },
    // Format phone number to standard format
    formatPhoneNumber: (phone) => {
        return phone.replace(/\D/g, '');
    },
    // Normalize email to lowercase
    normalizeEmail: (email) => {
        return email.toLowerCase().trim();
    },
    // Remove extra spaces and normalize case
    normalizeText: (text) => {
        return text.trim().replace(/\s+/g, ' ');
    }
};
exports.default = {
    validateRequest: exports.validateRequest,
    customValidations: exports.customValidations,
    commonValidationRules: exports.commonValidationRules,
    formatValidationErrors: exports.formatValidationErrors,
    sanitize: exports.sanitize
};
//# sourceMappingURL=validation.middleware.js.map