"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const User_model_1 = require("@/models/User.model");
const UserProfile_model_1 = require("@/models/UserProfile.model");
const Role_model_1 = require("@/models/Role.model");
const password_1 = require("@/utils/password");
const jwt_1 = require("@/utils/jwt");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const error_middleware_1 = require("@/middlewares/error.middleware");
const logger_1 = require("@/utils/logger");
const redis_config_1 = require("@/config/redis.config");
// Register new user
exports.register = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { username, email, password, fullName, phone, dateOfBirth, gender = 'OTHER' } = req.body;
    // Check if user already exists
    const existingUser = await User_model_1.User.findOne({
        where: {
            $or: [{ email }, { username }]
        }
    });
    if (existingUser) {
        throw error_middleware_1.createError.conflict('User with this email or username already exists');
    }
    // Get member role (default for registration)
    const memberRole = await Role_model_1.Role.findByName('MEMBER');
    if (!memberRole) {
        throw error_middleware_1.createError.internal('Member role not found');
    }
    // Hash password
    const passwordHash = await (0, password_1.hashPassword)(password);
    // Create user
    const user = await User_model_1.User.create({
        roleId: memberRole.id,
        username,
        email,
        passwordHash,
        phone,
        status: 'ACTIVE'
    });
    // Create user profile
    await UserProfile_model_1.UserProfile.create({
        userId: user.id,
        fullName,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
    });
    // Load user with associations
    const newUser = await User_model_1.User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash'] },
        include: [
            {
                association: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                association: 'profile',
                attributes: ['id', 'fullName', 'gender', 'dateOfBirth', 'avatarUrl']
            }
        ]
    });
    if (!newUser) {
        throw error_middleware_1.createError.internal('Failed to create user');
    }
    // Generate tokens
    const tokens = (0, jwt_1.generateTokenPair)(newUser);
    // Log registration
    logger_1.loggers.auth.register(email, req.ip, true);
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: newUser.toSafeJSON(),
            tokens
        }
    });
});
// User login
exports.login = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user with role and profile
    const user = await User_model_1.User.findOne({
        where: { email },
        include: [
            {
                model: Role_model_1.Role,
                as: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                model: UserProfile_model_1.UserProfile,
                as: 'profile',
                attributes: ['id', 'fullName', 'gender', 'avatarUrl'],
                required: false
            }
        ]
    });
    if (!user) {
        logger_1.loggers.auth.login(0, email, req.ip, false);
        throw error_middleware_1.createError.unauthorized('Invalid email or password');
    }
    // Check if user is active
    if (!user.status || user.status !== 'ACTIVE') {
        logger_1.loggers.auth.login(user.id, email, req.ip, false);
        throw error_middleware_1.createError.unauthorized('Account is not active');
    }
    // Compare password
    const isPasswordValid = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!isPasswordValid) {
        logger_1.loggers.auth.login(user.id, email, req.ip, false);
        throw error_middleware_1.createError.unauthorized('Invalid email or password');
    }
    // Generate tokens before updating last login to preserve associations
    const tokens = (0, jwt_1.generateTokenPair)(user);
    // Update last login
    await user.updateLastLogin();
    // Log successful login
    logger_1.loggers.auth.login(user.id, email, req.ip, true);
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: user.toSafeJSON(),
            tokens
        }
    });
});
// User logout
exports.logout = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw error_middleware_1.createError.unauthorized('No token provided');
    }
    const token = authHeader.substring(7);
    const user = req.user;
    try {
        // Get token expiration time and blacklist it
        const exp = require('jsonwebtoken').decode(token)?.exp;
        if (exp) {
            await (0, auth_middleware_1.blacklistToken)(token, exp);
        }
        // Log logout
        logger_1.loggers.auth.logout(user.id, user.email);
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        // Even if blacklisting fails, respond with success
        // The token will expire naturally
        logger_1.loggers.auth.logout(user.id, user.email);
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
});
// Refresh token
exports.refreshToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw error_middleware_1.createError.unauthorized('Refresh token is required');
    }
    // Verify refresh token
    const decoded = await (0, jwt_1.verifyRefreshToken)(refreshToken);
    // Find user
    const user = await User_model_1.User.findByPk(decoded.userId, {
        attributes: { exclude: ['passwordHash'] },
        include: [
            {
                association: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                association: 'profile',
                attributes: ['id', 'fullName', 'avatarUrl']
            }
        ]
    });
    if (!user || user.status !== 'ACTIVE') {
        throw error_middleware_1.createError.unauthorized('Invalid refresh token');
    }
    // Generate new token pair
    const tokens = (0, jwt_1.generateTokenPair)(user);
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            user: user.toSafeJSON(),
            tokens
        }
    });
});
// Forgot password
exports.forgotPassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await User_model_1.User.findByEmail(email);
    if (!user) {
        // Don't reveal if email exists
        res.json({
            success: true,
            message: 'If your email is registered, you will receive password reset instructions'
        });
        return;
    }
    // Generate password reset token
    const resetToken = (0, jwt_1.generatePasswordResetToken)(user.id, user.email);
    // Store reset token in Redis with expiration
    const redis = await (0, redis_config_1.getRedisService)();
    await redis.set(`password_reset:${user.id}`, resetToken, 3600); // 1 hour
    // Log password reset request
    logger_1.loggers.auth.passwordReset(email, req.ip);
    // TODO: Send email with reset link
    // For development, return the token (remove in production)
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    res.json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions',
        ...(process.env.NODE_ENV === 'development' && { resetLink })
    });
});
// Reset password
exports.resetPassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    // Verify reset token
    const { userId, email } = await (0, jwt_1.verifyPasswordResetToken)(token);
    // Check if token exists in Redis
    const redis = await (0, redis_config_1.getRedisService)();
    const storedToken = await redis.get(`password_reset:${userId}`);
    if (!storedToken || storedToken !== token) {
        throw error_middleware_1.createError.unauthorized('Invalid or expired password reset token');
    }
    // Find user
    const user = await User_model_1.User.findByPk(userId);
    if (!user || user.email !== email) {
        throw error_middleware_1.createError.unauthorized('Invalid password reset token');
    }
    // Hash new password
    const passwordHash = await (0, password_1.hashPassword)(password);
    // Update password
    await user.update({ passwordHash });
    // Remove reset token from Redis
    await redis.del(`password_reset:${userId}`);
    // Log password reset
    logger_1.loggers.auth.passwordReset(email, req.ip);
    res.json({
        success: true,
        message: 'Password reset successfully'
    });
});
// Change password
exports.changePassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    // Verify current password
    const isCurrentPasswordValid = await (0, password_1.comparePassword)(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
        throw error_middleware_1.createError.unauthorized('Current password is incorrect');
    }
    // Check if new password is different
    const isSamePassword = await (0, password_1.comparePassword)(newPassword, user.passwordHash);
    if (isSamePassword) {
        throw error_middleware_1.createError.validation('New password must be different from current password');
    }
    // Hash new password
    const passwordHash = await (0, password_1.hashPassword)(newPassword);
    // Update password
    await user.update({ passwordHash });
    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});
// Get user profile
exports.getProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    // Get user with full profile data
    const fullUser = await User_model_1.User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash'] },
        include: [
            {
                association: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                association: 'profile',
                attributes: { exclude: [] }
            }
        ]
    });
    res.json({
        success: true,
        data: {
            user: fullUser?.toSafeJSON()
        }
    });
});
// Update user profile
exports.updateProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { fullName, phone, dateOfBirth, gender, address, bio } = req.body;
    // Update user fields
    const userUpdateData = {};
    if (phone !== undefined)
        userUpdateData.phone = phone;
    if (Object.keys(userUpdateData).length > 0) {
        await user.update(userUpdateData);
    }
    // Update profile fields
    const profileUpdateData = {};
    if (fullName !== undefined)
        profileUpdateData.fullName = fullName;
    if (dateOfBirth !== undefined)
        profileUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined)
        profileUpdateData.gender = gender;
    if (address !== undefined)
        profileUpdateData.address = address;
    if (bio !== undefined)
        profileUpdateData.bio = bio;
    if (Object.keys(profileUpdateData).length > 0) {
        await UserProfile_model_1.UserProfile.update(profileUpdateData, {
            where: { userId: user.id }
        });
    }
    // Get updated user
    const updatedUser = await User_model_1.User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash'] },
        include: [
            {
                association: 'role',
                attributes: ['id', 'name', 'description']
            },
            {
                association: 'profile',
                attributes: { exclude: [] }
            }
        ]
    });
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: updatedUser?.toSafeJSON()
        }
    });
});
exports.default = {
    register: exports.register,
    login: exports.login,
    logout: exports.logout,
    refreshToken: exports.refreshToken,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
    changePassword: exports.changePassword,
    getProfile: exports.getProfile,
    updateProfile: exports.updateProfile
};
//# sourceMappingURL=auth.controller.js.map