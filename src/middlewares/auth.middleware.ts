import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User.model';
import { createError } from '@/middlewares/error.middleware';
import { loggers } from '@/utils/logger';
import { getRedisService } from '@/config/redis.config';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: {
        userId?: number;
        role?: string;
      };
    }
  }
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extract JWT token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Check for token in cookies
  const cookieToken = req.cookies?.['gym_token'];
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

// Verify JWT token
const verifyToken = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as JwtPayload);
        }
      }
    );
  });
};

// Check if token is blacklisted
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const redis = await getRedisService();
    const blacklisted = await redis.exists(`blacklist:${token}`);
    return blacklisted;
  } catch (error) {
    loggers.cache.error('Check token blacklist', token.substring(0, 10), error as Error);
    // If Redis is down, allow the token (fail-open for availability)
    return false;
  }
};

// Main authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw createError.unauthorized('Access token is required');
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      throw createError.unauthorized('Token has been revoked');
    }

    // Verify token
    const decoded = await verifyToken(token);

    // Find user in database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          association: 'role',
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'profile',
          attributes: ['id', 'full_name', 'avatar_url']
        }
      ]
    });

    if (!user) {
      throw createError.unauthorized('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw createError.unauthorized('Account is not active');
    }

    // Add user to request object
    req.user = user;

    // Get role from JSON data since Sequelize associations might not be properly loaded
    const userData = user.toJSON() as any;
    const roleName = userData.role?.name || user.role?.name || 'UNKNOWN';

    // Update session info
    req.session = {
      userId: user.id,
      role: roleName
    };

    // Log successful authentication
    loggers.auth.login(user.id, user.email, req.ip, true);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      loggers.auth.tokenError(error.message, req.headers.authorization, req.ip);
      next(createError.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(); // Continue without authentication
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = await verifyToken(token);

    // Find user in database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          association: 'role',
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'profile',
          attributes: ['id', 'full_name', 'avatar_url']
        }
      ]
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
      req.session = {
        userId: user.id,
        role: user.role.name
      };
    }

    next();
  } catch (error) {
    // For optional auth, silently continue on any error
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError.unauthorized('Authentication required');
      }

      // Extract role from JWT token directly since Sequelize associations are problematic
      const authHeader = req.headers.authorization;
      let userRole: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(token) as any;
          userRole = decoded?.role;
        } catch (error) {
          console.error('Error decoding JWT in authorize middleware:', error);
        }
      }

      if (!userRole) {
        throw createError.forbidden('Role information not found');
      }

      if (!allowedRoles.includes(userRole)) {
        loggers.app.warn('Access denied', {
          userId: req.user.id,
          userRole,
          allowedRoles,
          path: req.originalUrl,
          method: req.method,
          ip: req.ip
        });

        throw createError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Self or admin access middleware (user can access their own data or admin can access any)
export const selfOrAdmin = (getUserId: (req: Request) => number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError.unauthorized('Authentication required');
      }

      const targetUserId = getUserId(req);
      const currentUserId = req.user.id;
      const userRole = req.user.role.name;

      // Admin can access anything
      if (['ADMIN', 'STAFF'].includes(userRole)) {
        return next();
      }

      // User can only access their own data
      if (currentUserId !== targetUserId) {
        loggers.app.warn('Unauthorized access attempt', {
          userId: currentUserId,
          targetUserId,
          path: req.originalUrl,
          method: req.method,
          ip: req.ip
        });

        throw createError.forbidden('You can only access your own data');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Resource ownership middleware (for trainer-member relationships, etc.)
export const checkResourceOwnership = (getResourceOwner: (req: Request) => Promise<number>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError.unauthorized('Authentication required');
      }

      const resourceOwnerId = await getResourceOwner(req);
      const currentUserId = req.user.id;
      const userRole = req.user.role.name;

      // Admin can access anything
      if (['ADMIN', 'STAFF'].includes(userRole)) {
        return next();
      }

      // Check ownership
      if (currentUserId !== resourceOwnerId) {
        throw createError.forbidden('You do not have access to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting by user
export const rateLimitByUser = (maxRequests: number = 100, windowMinutes: number = 15) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(); // Skip rate limiting for unauthenticated requests
      }

      const redis = await getRedisService();
      const userId = req.user.id;
      const windowSeconds = windowMinutes * 60;

      const { allowed, remaining, resetTime } = await redis.rateLimitCheck(
        `user:${userId}`,
        maxRequests,
        windowSeconds
      );

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      });

      if (!allowed) {
        loggers.app.warn('Rate limit exceeded', {
          userId,
          path: req.originalUrl,
          method: req.method,
          ip: req.ip
        });

        throw createError.tooManyRequests('Rate limit exceeded');
      }

      next();
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        next(error);
      } else {
        // If Redis is down, allow the request
        loggers.cache.error('Rate limit check', `user:${req.user?.id}`, error as Error);
        next();
      }
    }
  };
};

// Blacklist token (for logout)
export const blacklistToken = async (token: string, expirationTime?: number): Promise<void> => {
  try {
    const redis = await getRedisService();
    const ttl = expirationTime ? Math.max(0, expirationTime - Math.floor(Date.now() / 1000)) : 86400; // 24 hours default

    await redis.set(`blacklist:${token}`, '1', ttl);
  } catch (error) {
    loggers.cache.error('Blacklist token', token.substring(0, 10), error as Error);
    throw error;
  }
};

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  selfOrAdmin,
  checkResourceOwnership,
  rateLimitByUser,
  blacklistToken
};