"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenUtils = exports.verifyEmailVerificationToken = exports.generateEmailVerificationToken = exports.verifyPasswordResetToken = exports.generatePasswordResetToken = exports.extractUserFromToken = exports.getTimeUntilExpiry = exports.isTokenExpired = exports.getTokenExpirationTime = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("@/utils/logger");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
// Generate access token
const generateAccessToken = (user) => {
    // Get role from JSON data since Sequelize associations might not be properly loaded
    const userData = user.toJSON();
    const roleName = userData.role?.name || user.role?.name || 'UNKNOWN';
    const payload = {
        userId: user.id,
        email: user.email,
        role: roleName,
        type: 'access'
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
        issuer: 'gym-management-api',
        audience: 'gym-management-app',
        subject: user.id.toString()
    });
};
exports.generateAccessToken = generateAccessToken;
// Generate refresh token
const generateRefreshToken = (user) => {
    // Get role from JSON data since Sequelize associations might not be properly loaded
    const userData = user.toJSON();
    const roleName = userData.role?.name || user.role?.name || 'UNKNOWN';
    const payload = {
        userId: user.id,
        email: user.email,
        role: roleName,
        type: 'refresh'
    };
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRE,
        issuer: 'gym-management-api',
        audience: 'gym-management-app',
        subject: user.id.toString()
    });
};
exports.generateRefreshToken = generateRefreshToken;
// Generate token pair
const generateTokenPair = (user) => {
    const accessToken = (0, exports.generateAccessToken)(user);
    const refreshToken = (0, exports.generateRefreshToken)(user);
    logger_1.loggers.auth.login(user.id, user.email, '', true);
    return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRE,
        refreshExpiresIn: JWT_REFRESH_EXPIRE
    };
};
exports.generateTokenPair = generateTokenPair;
// Verify access token
const verifyAccessToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                logger_1.loggers.auth.tokenError(err.message, token.substring(0, 10));
                reject(err);
            }
            else {
                const payload = decoded;
                if (payload.type !== 'access') {
                    reject(new Error('Invalid token type'));
                    return;
                }
                resolve(payload);
            }
        });
    });
};
exports.verifyAccessToken = verifyAccessToken;
// Verify refresh token
const verifyRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                logger_1.loggers.auth.tokenError(err.message, token.substring(0, 10));
                reject(err);
            }
            else {
                const payload = decoded;
                if (payload.type !== 'refresh') {
                    reject(new Error('Invalid token type'));
                    return;
                }
                resolve(payload);
            }
        });
    });
};
exports.verifyRefreshToken = verifyRefreshToken;
// Get token expiration time
const getTokenExpirationTime = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded?.exp || null;
    }
    catch (error) {
        return null;
    }
};
exports.getTokenExpirationTime = getTokenExpirationTime;
// Check if token is expired
const isTokenExpired = (token) => {
    const exp = (0, exports.getTokenExpirationTime)(token);
    if (!exp)
        return true;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
};
exports.isTokenExpired = isTokenExpired;
// Get time until token expires (in seconds)
const getTimeUntilExpiry = (token) => {
    const exp = (0, exports.getTokenExpirationTime)(token);
    if (!exp)
        return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, exp - now);
};
exports.getTimeUntilExpiry = getTimeUntilExpiry;
// Extract user info from token (without verification)
const extractUserFromToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
    }
    catch (error) {
        return null;
    }
};
exports.extractUserFromToken = extractUserFromToken;
// Generate password reset token
const generatePasswordResetToken = (userId, email) => {
    const payload = {
        userId,
        email,
        type: 'password_reset',
        timestamp: Date.now()
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '1h', // Password reset tokens expire in 1 hour
        issuer: 'gym-management-api',
        audience: 'gym-management-app',
        subject: userId.toString()
    });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
// Verify password reset token
const verifyPasswordResetToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                reject(err);
            }
            else {
                const payload = decoded;
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
exports.verifyPasswordResetToken = verifyPasswordResetToken;
// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
    const payload = {
        userId,
        email,
        type: 'email_verification',
        timestamp: Date.now()
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '24h', // Email verification tokens expire in 24 hours
        issuer: 'gym-management-api',
        audience: 'gym-management-app',
        subject: userId.toString()
    });
};
exports.generateEmailVerificationToken = generateEmailVerificationToken;
// Verify email verification token
const verifyEmailVerificationToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                reject(err);
            }
            else {
                const payload = decoded;
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
exports.verifyEmailVerificationToken = verifyEmailVerificationToken;
// Token utilities for development/debugging
exports.tokenUtils = {
    // Decode token without verification (for debugging)
    decode: (token) => {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    },
    // Get token header
    getHeader: (token) => {
        try {
            return jsonwebtoken_1.default.decode(token, { complete: true })?.header;
        }
        catch (error) {
            return null;
        }
    },
    // Get token payload
    getPayload: (token) => {
        try {
            return jsonwebtoken_1.default.decode(token, { complete: true })?.payload;
        }
        catch (error) {
            return null;
        }
    },
    // Check token format
    isValidFormat: (token) => {
        const parts = token.split('.');
        return parts.length === 3;
    }
};
exports.default = {
    generateAccessToken: exports.generateAccessToken,
    generateRefreshToken: exports.generateRefreshToken,
    generateTokenPair: exports.generateTokenPair,
    verifyAccessToken: exports.verifyAccessToken,
    verifyRefreshToken: exports.verifyRefreshToken,
    generatePasswordResetToken: exports.generatePasswordResetToken,
    verifyPasswordResetToken: exports.verifyPasswordResetToken,
    generateEmailVerificationToken: exports.generateEmailVerificationToken,
    verifyEmailVerificationToken: exports.verifyEmailVerificationToken,
    getTokenExpirationTime: exports.getTokenExpirationTime,
    isTokenExpired: exports.isTokenExpired,
    getTimeUntilExpiry: exports.getTimeUntilExpiry,
    extractUserFromToken: exports.extractUserFromToken,
    tokenUtils: exports.tokenUtils
};
//# sourceMappingURL=jwt.js.map