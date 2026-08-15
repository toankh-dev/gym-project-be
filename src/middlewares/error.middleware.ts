import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger, loggers } from '@/utils/logger';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError400 extends CustomError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
}

// Main error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _: NextFunction
): void => {
  const error = { ...err } as AppError;
  error.message = err.message;

  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Log the error
  const errorContext = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
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
      loggers.http.error(req.method, req.originalUrl, statusCode, err);
    } else {
      logger.warn(`Client Error ${statusCode}: ${message}`, errorContext);
    }
  } else if (err instanceof ValidationError) {
    // Sequelize validation errors
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.errors?.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));

    logger.warn('Database Validation Error', { ...errorContext, errors: err.errors });
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    // Sequelize unique constraint errors
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
    details = {
      fields: (err as any).fields,
      value: (err as any).value
    };

    logger.warn('Unique Constraint Violation', { ...errorContext, fields: (err as any).fields });
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    // Sequelize foreign key constraint errors
    statusCode = 400;
    message = 'Invalid reference to related resource';
    code = 'FOREIGN_KEY_ERROR';

    logger.warn('Foreign Key Constraint Violation', errorContext);
  } else if (err.name === 'SequelizeDatabaseError') {
    // General database errors
    statusCode = 500;
    message = 'Database operation failed';
    code = 'DATABASE_ERROR';

    loggers.db.error('Database operation failed', err, errorContext);
  } else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    // JWT errors
    statusCode = 401;
    message = err.message;
    code = 'TOKEN_ERROR';

    loggers.auth.tokenError(err.message, req.get('Authorization'), req.ip);
  } else if (err.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';

    switch ((err as any).code) {
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

    logger.warn('File Upload Error', { ...errorContext, code: (err as any).code });
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // JSON parsing errors
    statusCode = 400;
    message = 'Invalid JSON in request body';
    code = 'INVALID_JSON';

    logger.warn('JSON Parsing Error', errorContext);
  } else {
    // Unknown errors
    loggers.app.error('Unexpected Error', err, errorContext);
  }

  // Create error response
  const requestId = req.get('X-Request-ID');
  const errorResponse: ErrorResponse = {
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
    (errorResponse.error as any).stack = err.stack;
  }

  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error factory functions
export const createError = {
  validation: (message: string, details?: any) => {
    const error = new ValidationError400(message);
    (error as any).details = details;
    return error;
  },

  unauthorized: (message?: string) => new UnauthorizedError(message),

  forbidden: (message?: string) => new ForbiddenError(message),

  notFound: (resource: string = 'Resource') => new NotFoundError(`${resource} not found`),

  conflict: (message?: string) => new ConflictError(message),

  tooManyRequests: (message?: string) => new TooManyRequestsError(message),

  internal: (message?: string) => new InternalServerError(message)
};

export default errorHandler;