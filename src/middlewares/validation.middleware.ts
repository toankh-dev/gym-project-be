import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { createError } from '@/middlewares/error.middleware';

// Validation middleware to handle express-validator results
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: any) => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
      location: error.type === 'field' ? error.location : 'body'
    }));

    const errorMessage = validationErrors
      .map(err => `${err.field}: ${err.message}`)
      .join(', ');

    throw createError.validation(`Validation failed: ${errorMessage}`, validationErrors);
  }

  next();
};

// Custom validation helpers
export const customValidations = {
  // Check if value is a valid MySQL date
  isValidDate: (value: string): boolean => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  },

  // Check if value is a valid phone number (basic validation)
  isValidPhone: (value: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(value);
  },

  // Check if value is a valid time format (HH:MM)
  isValidTime: (value: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  },

  // Check if end time is after start time
  isEndTimeAfterStartTime: (startTime: string, endTime: string): boolean => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    return end > start;
  },

  // Check if date is in the future
  isFutureDate: (value: string): boolean => {
    const date = new Date(value);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day
    return date >= now;
  },

  // Check if date is within a reasonable range (e.g., birth date)
  isBirthDateValid: (value: string): boolean => {
    const date = new Date(value);
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
    const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate()); // 13 years ago

    return date >= minDate && date <= maxDate;
  },

  // Check if password meets security requirements
  isStrongPassword: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  },

  // Check if email is from allowed domains (optional)
  isAllowedEmailDomain: (email: string, allowedDomains: string[] = []): boolean => {
    if (allowedDomains.length === 0) return true;

    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.includes(domain);
  },

  // Check if username is available (placeholder - would check database)
  isUsernameAvailable: async (username: string): Promise<boolean> => {
    // This would typically check the database
    // For now, just return true as a placeholder
    return true;
  },

  // Check if email is available (placeholder - would check database)
  isEmailAvailable: async (email: string): Promise<boolean> => {
    // This would typically check the database
    // For now, just return true as a placeholder
    return true;
  },

  // Check if value is a valid currency amount
  isValidAmount: (value: number, min: number = 0, max: number = 999999999): boolean => {
    return value >= min && value <= max && Number.isFinite(value);
  },

  // Check if array has unique values
  hasUniqueValues: (array: any[]): boolean => {
    return new Set(array).size === array.length;
  },

  // Check if string contains only allowed characters
  hasAllowedCharacters: (value: string, allowedPattern: RegExp): boolean => {
    return allowedPattern.test(value);
  },

  // Check if file type is allowed
  isAllowedFileType: (filename: string, allowedTypes: string[]): boolean => {
    const extension = filename.toLowerCase().split('.').pop();
    return allowedTypes.includes(extension || '');
  },

  // Check if file size is within limits
  isFileSizeValid: (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
    return size <= maxSize;
  }
};

// Common validation rules that can be reused
export const commonValidationRules = {
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
export const formatValidationErrors = (errors: any[]): any[] => {
  return errors.map(error => {
    if (error.type === 'field') {
      return {
        field: error.path,
        message: error.msg,
        value: error.value,
        location: error.location
      };
    } else {
      return {
        message: error.msg,
        location: error.type === 'field' ? error.location : 'body'
      };
    }
  });
};

// Sanitization helpers
export const sanitize = {
  // Remove HTML tags and trim whitespace
  cleanString: (value: string): string => {
    return value.replace(/<[^>]*>/g, '').trim();
  },

  // Escape special characters for database
  escapeSpecialChars: (value: string): string => {
    return value.replace(/['"\\]/g, '\\$&');
  },

  // Format phone number to standard format
  formatPhoneNumber: (phone: string): string => {
    return phone.replace(/\D/g, '');
  },

  // Normalize email to lowercase
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Remove extra spaces and normalize case
  normalizeText: (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  }
};

export default {
  validateRequest,
  customValidations,
  commonValidationRules,
  formatValidationErrors,
  sanitize
};