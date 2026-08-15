import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (stack) {
      log += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? customFormat : consoleFormat
  })
);

// File transports (only in production or when LOG_FILE_PATH is specified)
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE_PATH) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat
    })
  );

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat
    })
  );

  // Access log file (for HTTP requests)
  transports.push(
    new DailyRotateFile({
      level: 'http',
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exitOnError: false
});

// Create specialized loggers
export const httpLogger = logger.child({ service: 'http' });
export const dbLogger = logger.child({ service: 'database' });
export const authLogger = logger.child({ service: 'auth' });
export const cacheLogger = logger.child({ service: 'cache' });

// Log level methods with context
export const loggers = {
  // General application logs
  app: {
    debug: (message: string, meta?: any) => logger.debug(message, { service: 'app', ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { service: 'app', ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { service: 'app', ...meta }),
    error: (message: string, error?: Error | any, meta?: any) => {
      logger.error(message, {
        service: 'app',
        error: error?.message || error,
        stack: error?.stack,
        ...meta
      });
    }
  },

  // HTTP request logs
  http: {
    request: (method: string, url: string, ip: string, userAgent?: string) => {
      httpLogger.http('HTTP Request', { method, url, ip, userAgent });
    },
    response: (method: string, url: string, statusCode: number, responseTime: number) => {
      httpLogger.http('HTTP Response', { method, url, statusCode, responseTime });
    },
    error: (method: string, url: string, statusCode: number, error: Error) => {
      httpLogger.error('HTTP Error', {
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
    query: (sql: string, duration?: number) => {
      dbLogger.debug('Database Query', { sql, duration });
    },
    error: (operation: string, error: Error, meta?: any) => {
      dbLogger.error(`Database Error: ${operation}`, {
        error: error.message,
        stack: error.stack,
        ...meta
      });
    },
    connection: (status: 'connected' | 'disconnected' | 'error', meta?: any) => {
      dbLogger.info(`Database ${status}`, meta);
    }
  },

  // Authentication logs
  auth: {
    login: (userId: number, email: string, ip: string, success: boolean) => {
      authLogger.info('Login Attempt', { userId, email, ip, success });
    },
    logout: (userId: number, email: string) => {
      authLogger.info('User Logout', { userId, email });
    },
    register: (email: string, ip: string, success: boolean) => {
      authLogger.info('Registration Attempt', { email, ip, success });
    },
    passwordReset: (email: string, ip: string) => {
      authLogger.info('Password Reset Request', { email, ip });
    },
    tokenError: (error: string, token?: string, ip?: string) => {
      authLogger.warn('Token Validation Error', { error, token: token?.substring(0, 10), ip });
    }
  },

  // Cache operation logs
  cache: {
    hit: (key: string, ttl?: number) => {
      cacheLogger.debug('Cache Hit', { key, ttl });
    },
    miss: (key: string) => {
      cacheLogger.debug('Cache Miss', { key });
    },
    set: (key: string, ttl: number) => {
      cacheLogger.debug('Cache Set', { key, ttl });
    },
    delete: (key: string) => {
      cacheLogger.debug('Cache Delete', { key });
    },
    error: (operation: string, key: string, error: Error) => {
      cacheLogger.error(`Cache Error: ${operation}`, {
        key,
        error: error.message,
        stack: error.stack
      });
    }
  },

  // Business logic logs
  business: {
    memberRegistered: (memberId: number, memberCode: string) => {
      logger.info('New Member Registered', { memberId, memberCode, service: 'business' });
    },
    subscriptionCreated: (subscriptionId: number, memberId: number, packageId: number) => {
      logger.info('Subscription Created', { subscriptionId, memberId, packageId, service: 'business' });
    },
    paymentProcessed: (paymentId: number, amount: number, status: string) => {
      logger.info('Payment Processed', { paymentId, amount, status, service: 'business' });
    },
    scheduleBooked: (scheduleId: number, memberId: number) => {
      logger.info('Schedule Booked', { scheduleId, memberId, service: 'business' });
    }
  }
};

// Error logging helper
export const logError = (error: Error, context?: string, meta?: any) => {
  logger.error(context || 'Application Error', {
    error: error.message,
    stack: error.stack,
    ...meta
  });
};

// Performance logging helper
export const logPerformance = (operation: string, startTime: number, meta?: any) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation}`, {
    duration,
    service: 'performance',
    ...meta
  });
};

export default logger;