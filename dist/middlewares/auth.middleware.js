"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklistToken = exports.rateLimitByUser = exports.checkResourceOwnership = exports.selfOrAdmin = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("@/models/User.model");
const error_middleware_1 = require("@/middlewares/error.middleware");
const logger_1 = require("@/utils/logger");
const redis_config_1 = require("@/config/redis.config");
// Extract JWT token from request
const extractToken = (req) => {
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
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(decoded);
            }
        });
    });
};
// Check if token is blacklisted
const isTokenBlacklisted = async (token) => {
    try {
        const redis = await (0, redis_config_1.getRedisService)();
        const blacklisted = await redis.exists(`blacklist:${token}`);
        return blacklisted;
    }
    catch (error) {
        logger_1.loggers.cache.error('Check token blacklist', token.substring(0, 10), error);
        // If Redis is down, allow the token (fail-open for availability)
        return false;
    }
};
// Main authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            throw error_middleware_1.createError.unauthorized('Access token is required');
        }
        // Check if token is blacklisted
        if (await isTokenBlacklisted(token)) {
            throw error_middleware_1.createError.unauthorized('Token has been revoked');
        }
        // Verify token
        const decoded = await verifyToken(token);
        // Find user in database
        const user = await User_model_1.User.findByPk(decoded.userId, {
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
            throw error_middleware_1.createError.unauthorized('User not found');
        }
        if (user.status !== 'ACTIVE') {
            throw error_middleware_1.createError.unauthorized('Account is not active');
        }
        // Add user to request object
        req.user = user;
        // Get role from JSON data since Sequelize associations might not be properly loaded
        const userData = user.toJSON();
        const roleName = userData.role?.name || user.role?.name || 'UNKNOWN';
        // Update session info
        req.session = {
            userId: user.id,
            role: roleName
        };
        // Log successful authentication
        logger_1.loggers.auth.login(user.id, user.email, req.ip, true);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError || error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.loggers.auth.tokenError(error.message, req.headers.authorization, req.ip);
            next(error_middleware_1.createError.unauthorized('Invalid or expired token'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
// Optional authentication middleware (for public endpoints that can benefit from user context)
const optionalAuthenticate = async (req, res, next) => {
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
        const user = await User_model_1.User.findByPk(decoded.userId, {
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
    }
    catch (error) {
        // For optional auth, silently continue on any error
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
// Role-based authorization middleware
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw error_middleware_1.createError.unauthorized('Authentication required');
            }
            // Extract role from JWT token directly since Sequelize associations are problematic
            const authHeader = req.headers.authorization;
            let userRole;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.substring(7);
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.decode(token);
                    userRole = decoded?.role;
                }
                catch (error) {
                    console.error('Error decoding JWT in authorize middleware:', error);
                }
            }
            if (!userRole) {
                throw error_middleware_1.createError.forbidden('Role information not found');
            }
            if (!allowedRoles.includes(userRole)) {
                logger_1.loggers.app.warn('Access denied', {
                    userId: req.user.id,
                    userRole,
                    allowedRoles,
                    path: req.originalUrl,
                    method: req.method,
                    ip: req.ip
                });
                throw error_middleware_1.createError.forbidden('Insufficient permissions');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
// Self or admin access middleware (user can access their own data or admin can access any)
const selfOrAdmin = (getUserId) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw error_middleware_1.createError.unauthorized('Authentication required');
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
                logger_1.loggers.app.warn('Unauthorized access attempt', {
                    userId: currentUserId,
                    targetUserId,
                    path: req.originalUrl,
                    method: req.method,
                    ip: req.ip
                });
                throw error_middleware_1.createError.forbidden('You can only access your own data');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.selfOrAdmin = selfOrAdmin;
// Resource ownership middleware (for trainer-member relationships, etc.)
const checkResourceOwnership = (getResourceOwner) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw error_middleware_1.createError.unauthorized('Authentication required');
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
                throw error_middleware_1.createError.forbidden('You do not have access to this resource');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkResourceOwnership = checkResourceOwnership;
// Rate limiting by user
const rateLimitByUser = (maxRequests = 100, windowMinutes = 15) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(); // Skip rate limiting for unauthenticated requests
            }
            const redis = await (0, redis_config_1.getRedisService)();
            const userId = req.user.id;
            const windowSeconds = windowMinutes * 60;
            const { allowed, remaining, resetTime } = await redis.rateLimitCheck(`user:${userId}`, maxRequests, windowSeconds);
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': resetTime.toString()
            });
            if (!allowed) {
                logger_1.loggers.app.warn('Rate limit exceeded', {
                    userId,
                    path: req.originalUrl,
                    method: req.method,
                    ip: req.ip
                });
                throw error_middleware_1.createError.tooManyRequests('Rate limit exceeded');
            }
            next();
        }
        catch (error) {
            if (error.message === 'Rate limit exceeded') {
                next(error);
            }
            else {
                // If Redis is down, allow the request
                logger_1.loggers.cache.error('Rate limit check', `user:${req.user?.id}`, error);
                next();
            }
        }
    };
};
exports.rateLimitByUser = rateLimitByUser;
// Blacklist token (for logout)
const blacklistToken = async (token, expirationTime) => {
    try {
        const redis = await (0, redis_config_1.getRedisService)();
        const ttl = expirationTime ? Math.max(0, expirationTime - Math.floor(Date.now() / 1000)) : 86400; // 24 hours default
        await redis.set(`blacklist:${token}`, '1', ttl);
    }
    catch (error) {
        logger_1.loggers.cache.error('Blacklist token', token.substring(0, 10), error);
        throw error;
    }
};
exports.blacklistToken = blacklistToken;
exports.default = {
    authenticate: exports.authenticate,
    optionalAuthenticate: exports.optionalAuthenticate,
    authorize: exports.authorize,
    selfOrAdmin: exports.selfOrAdmin,
    checkResourceOwnership: exports.checkResourceOwnership,
    rateLimitByUser: exports.rateLimitByUser,
    blacklistToken: exports.blacklistToken
};
//# sourceMappingURL=auth.middleware.js.map