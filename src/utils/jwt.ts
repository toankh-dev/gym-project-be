import jwt from 'jsonwebtoken';
import { User } from '@/models/User.model';
import { loggers } from '@/utils/logger';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Generate access token
export const generateAccessToken = (user: User): string => {
  // Get role from JSON data since Sequelize associations might not be properly loaded
  const userData = user.toJSON() as any;
  const roleName = userData.role?.name || user.role?.name || 'UNKNOWN';

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: roleName,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
    issuer: 'gym-management-api',
    audience: 'gym-management-app',
    subject: user.id.toString()
  } as jwt.SignOptions);
};

// Generate refresh token
export const generateRefreshToken = (user: User): string => {
  // Get role from JSON data since Sequelize associations might not be properly loaded
  const userData = user.toJSON() as any;
  const roleName = userData.role?.name || user.role?.name || 'UNKNOWN';

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: roleName,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
    issuer: 'gym-management-api',
    audience: 'gym-management-app',
    subject: user.id.toString()
  } as jwt.SignOptions);
};

// Generate token pair
export const generateTokenPair = (user: User): TokenPair => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  loggers.auth.login(user.id, user.email, '', true);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRE,
    refreshExpiresIn: JWT_REFRESH_EXPIRE
  };
};

// Verify access token
export const verifyAccessToken = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        loggers.auth.tokenError(err.message, token.substring(0, 10));
        reject(err);
      } else {
        const payload = decoded as JwtPayload;
        if (payload.type !== 'access') {
          reject(new Error('Invalid token type'));
          return;
        }
        resolve(payload);
      }
    });
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        loggers.auth.tokenError(err.message, token.substring(0, 10));
        reject(err);
      } else {
        const payload = decoded as JwtPayload;
        if (payload.type !== 'refresh') {
          reject(new Error('Invalid token type'));
          return;
        }
        resolve(payload);
      }
    });
  });
};

// Get token expiration time
export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.exp || null;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const exp = getTokenExpirationTime(token);
  if (!exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return exp < now;
};

// Get time until token expires (in seconds)
export const getTimeUntilExpiry = (token: string): number => {
  const exp = getTokenExpirationTime(token);
  if (!exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now);
};

// Extract user info from token (without verification)
export const extractUserFromToken = (token: string): Partial<JwtPayload> | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
};

// Generate password reset token
export const generatePasswordResetToken = (userId: number, email: string): string => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    timestamp: Date.now()
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h', // Password reset tokens expire in 1 hour
    issuer: 'gym-management-api',
    audience: 'gym-management-app',
    subject: userId.toString()
  });
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): Promise<{ userId: number; email: string }> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        reject(err);
      } else {
        const payload = decoded as any;
        if (payload.type !== 'password_reset') {
          reject(new Error('Invalid token type'));
          return;
        }

        // Check if token is older than 1 hour
        const tokenAge = Date.now() - payload.timestamp;
        if (tokenAge > 60 * 60 * 1000) { // 1 hour in milliseconds
          reject(new Error('Password reset token has expired'));
          return;
        }

        resolve({
          userId: payload.userId,
          email: payload.email
        });
      }
    });
  });
};

// Generate email verification token
export const generateEmailVerificationToken = (userId: number, email: string): string => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
    timestamp: Date.now()
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h', // Email verification tokens expire in 24 hours
    issuer: 'gym-management-api',
    audience: 'gym-management-app',
    subject: userId.toString()
  });
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): Promise<{ userId: number; email: string }> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        reject(err);
      } else {
        const payload = decoded as any;
        if (payload.type !== 'email_verification') {
          reject(new Error('Invalid token type'));
          return;
        }

        resolve({
          userId: payload.userId,
          email: payload.email
        });
      }
    });
  });
};

// Token utilities for development/debugging
export const tokenUtils = {
  // Decode token without verification (for debugging)
  decode: (token: string) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  },

  // Get token header
  getHeader: (token: string) => {
    try {
      return jwt.decode(token, { complete: true })?.header;
    } catch (error) {
      return null;
    }
  },

  // Get token payload
  getPayload: (token: string) => {
    try {
      return jwt.decode(token, { complete: true })?.payload;
    } catch (error) {
      return null;
    }
  },

  // Check token format
  isValidFormat: (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  getTokenExpirationTime,
  isTokenExpired,
  getTimeUntilExpiry,
  extractUserFromToken,
  tokenUtils
};