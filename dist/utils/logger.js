"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformance = exports.logError = exports.loggers = exports.cacheLogger = exports.authLogger = exports.dbLogger = exports.httpLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const logDir = path_1.default.join(__dirname, '../../logs');
// Custom format for better readability
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
}));
// Create transports
const transports = [];
// Console transport (always enabled)
transports.push(new winston_1.default.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? customFormat : consoleFormat
}));
// File transports (only in production or when LOG_FILE_PATH is specified)
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE_PATH) {
    // Error log file
    transports.push(new winston_daily_rotate_file_1.default({
        level: 'error',
        filename: path_1.default.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: customFormat
    }));
    // Combined log file
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: customFormat
    }));
    // Access log file (for HTTP requests)
    transports.push(new winston_daily_rotate_file_1.default({
        level: 'http',
        filename: path_1.default.join(logDir, 'access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: customFormat
    }));
}
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports,
    exitOnError: false
});
// Create specialized loggers
exports.httpLogger = exports.logger.child({ service: 'http' });
exports.dbLogger = exports.logger.child({ service: 'database' });
exports.authLogger = exports.logger.child({ service: 'auth' });
exports.cacheLogger = exports.logger.child({ service: 'cache' });
// Log level methods with context
exports.loggers = {
    // General application logs
    app: {
        debug: (message, meta) => exports.logger.debug(message, { service: 'app', ...meta }),
        info: (message, meta) => exports.logger.info(message, { service: 'app', ...meta }),
        warn: (message, meta) => exports.logger.warn(message, { service: 'app', ...meta }),
        error: (message, error, meta) => {
            exports.logger.error(message, {
                service: 'app',
                error: error?.message || error,
                stack: error?.stack,
                ...meta
            });
        }
    },
    // HTTP request logs
    http: {
        request: (method, url, ip, userAgent) => {
            exports.httpLogger.http('HTTP Request', { method, url, ip, userAgent });
        },
        response: (method, url, statusCode, responseTime) => {
            exports.httpLogger.http('HTTP Response', { method, url, statusCode, responseTime });
        },
        error: (method, url, statusCode, error) => {
            exports.httpLogger.error('HTTP Error', {
                method,
                url,
                statusCode,
                error: error.message,
                stack: error.stack
            });
        }
    },
    // Database operation logs
    db: {
        query: (sql, duration) => {
            exports.dbLogger.debug('Database Query', { sql, duration });
        },
        error: (operation, error, meta) => {
            exports.dbLogger.error(`Database Error: ${operation}`, {
                error: error.message,
                stack: error.stack,
                ...meta
            });
        },
        connection: (status, meta) => {
            exports.dbLogger.info(`Database ${status}`, meta);
        }
    },
    // Authentication logs
    auth: {
        login: (userId, email, ip, success) => {
            exports.authLogger.info('Login Attempt', { userId, email, ip, success });
        },
        logout: (userId, email) => {
            exports.authLogger.info('User Logout', { userId, email });
        },
        register: (email, ip, success) => {
            exports.authLogger.info('Registration Attempt', { email, ip, success });
        },
        passwordReset: (email, ip) => {
            exports.authLogger.info('Password Reset Request', { email, ip });
        },
        tokenError: (error, token, ip) => {
            exports.authLogger.warn('Token Validation Error', { error, token: token?.substring(0, 10), ip });
        }
    },
    // Cache operation logs
    cache: {
        hit: (key, ttl) => {
            exports.cacheLogger.debug('Cache Hit', { key, ttl });
        },
        miss: (key) => {
            exports.cacheLogger.debug('Cache Miss', { key });
        },
        set: (key, ttl) => {
            exports.cacheLogger.debug('Cache Set', { key, ttl });
        },
        delete: (key) => {
            exports.cacheLogger.debug('Cache Delete', { key });
        },
        error: (operation, key, error) => {
            exports.cacheLogger.error(`Cache Error: ${operation}`, {
                key,
                error: error.message,
                stack: error.stack
            });
        }
    },
    // Business logic logs
    business: {
        memberRegistered: (memberId, memberCode) => {
            exports.logger.info('New Member Registered', { memberId, memberCode, service: 'business' });
        },
        subscriptionCreated: (subscriptionId, memberId, packageId) => {
            exports.logger.info('Subscription Created', { subscriptionId, memberId, packageId, service: 'business' });
        },
        paymentProcessed: (paymentId, amount, status) => {
            exports.logger.info('Payment Processed', { paymentId, amount, status, service: 'business' });
        },
        scheduleBooked: (scheduleId, memberId) => {
            exports.logger.info('Schedule Booked', { scheduleId, memberId, service: 'business' });
        }
    }
};
// Error logging helper
const logError = (error, context, meta) => {
    exports.logger.error(context || 'Application Error', {
        error: error.message,
        stack: error.stack,
        ...meta
    });
};
exports.logError = logError;
// Performance logging helper
const logPerformance = (operation, startTime, meta) => {
    const duration = Date.now() - startTime;
    exports.logger.info(`Performance: ${operation}`, {
        duration,
        service: 'performance',
        ...meta
    });
};
exports.logPerformance = logPerformance;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map