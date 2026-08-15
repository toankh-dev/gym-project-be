"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.asyncHandler = exports.errorHandler = exports.InternalServerError = exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError400 = exports.CustomError = void 0;
const sequelize_1 = require("sequelize");
const jsonwebtoken_1 = require("jsonwebtoken");
const logger_1 = require("@/utils/logger");
class CustomError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
// Specific error classes
class ValidationError400 extends CustomError {
    constructor(message = 'Validation failed') {
        super(message, 400);
    }
}
exports.ValidationError400 = ValidationError400;
class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends CustomError {
    constructor(message = 'Forbidden access') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends CustomError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends CustomError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends CustomError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
// Main error handler middleware
const errorHandler = (err, req, res, _) => {
    let error = { ...err };
    error.message = err.message;
    // Default values
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = undefined;
    // Log the error
    const errorContext = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        body: req.body,
        params: req.params,
        query: req.query
    };
    // Handle different types of errors
    if (error.statusCode) {
        // Custom application errors
        statusCode = error.statusCode;
        message = error.message;
        code = error.constructor.name.replace('Error', '').toUpperCase();
        if (statusCode >= 500) {
            logger_1.loggers.http.error(req.method, req.originalUrl, statusCode, err);
        }
        else {
            logger_1.logger.warn(`Client Error ${statusCode}: ${message}`, errorContext);
        }
    }
    else if (err instanceof sequelize_1.ValidationError) {
        // Sequelize validation errors
        statusCode = 400;
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
        details = err.errors?.map(e => ({
            field: e.path,
            message: e.message,
            value: e.value
        }));
        logger_1.logger.warn('Database Validation Error', { ...errorContext, errors: err.errors });
    }
    else if (err.name === 'SequelizeUniqueConstraintError') {
        // Sequelize unique constraint errors
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ENTRY';
        details = {
            fields: err.fields,
            value: err.value
        };
        logger_1.logger.warn('Unique Constraint Violation', { ...errorContext, fields: err.fields });
    }
    else if (err.name === 'SequelizeForeignKeyConstraintError') {
        // Sequelize foreign key constraint errors
        statusCode = 400;
        message = 'Invalid reference to related resource';
        code = 'FOREIGN_KEY_ERROR';
        logger_1.logger.warn('Foreign Key Constraint Violation', errorContext);
    }
    else if (err.name === 'SequelizeDatabaseError') {
        // General database errors
        statusCode = 500;
        message = 'Database operation failed';
        code = 'DATABASE_ERROR';
        logger_1.loggers.db.error('Database operation failed', err, errorContext);
    }
    else if (err instanceof jsonwebtoken_1.JsonWebTokenError || err instanceof jsonwebtoken_1.TokenExpiredError) {
        // JWT errors
        statusCode = 401;
        message = err.message;
        code = 'TOKEN_ERROR';
        logger_1.loggers.auth.tokenError(err.message, req.get('Authorization'), req.ip);
    }
    else if (err.name === 'MulterError') {
        // File upload errors
        statusCode = 400;
        code = 'FILE_UPLOAD_ERROR';
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size too large';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field';
                break;
            default:
                message = 'File upload failed';
        }
        logger_1.logger.warn('File Upload Error', { ...errorContext, code: err.code });
    }
    else if (err.name === 'SyntaxError' && 'body' in err) {
        // JSON parsing errors
        statusCode = 400;
        message = 'Invalid JSON in request body';
        code = 'INVALID_JSON';
        logger_1.logger.warn('JSON Parsing Error', errorContext);
    }
    else {
        // Unknown errors
        logger_1.loggers.app.error('Unexpected Error', err, errorContext);
    }
    // Create error response
    const requestId = req.get('X-Request-ID');
    const errorResponse = {
        success: false,
        error: {
            message,
            code,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            ...(requestId ? { requestId } : {})
        }
    };
    // Add details only in development or for client errors
    if (details && (process.env.NODE_ENV === 'development' || statusCode < 500)) {
        errorResponse.error.details = details;
    }
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorResponse.error.stack = err.stack;
    }
    // Set security headers
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
    });
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Error factory functions
exports.createError = {
    validation: (message, details) => {
        const error = new ValidationError400(message);
        error.details = details;
        return error;
    },
    unauthorized: (message) => new UnauthorizedError(message),
    forbidden: (message) => new ForbiddenError(message),
    notFound: (resource = 'Resource') => new NotFoundError(`${resource} not found`),
    conflict: (message) => new ConflictError(message),
    tooManyRequests: (message) => new TooManyRequestsError(message),
    internal: (message) => new InternalServerError(message)
};
exports.default = exports.errorHandler;
//# sourceMappingURL=error.middleware.js.map