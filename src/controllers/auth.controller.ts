import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User.model';
import { UserProfile } from '@/models/UserProfile.model';
import { Role } from '@/models/Role.model';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokenPair, verifyRefreshToken, generatePasswordResetToken, verifyPasswordResetToken } from '@/utils/jwt';
import { blacklistToken } from '@/middlewares/auth.middleware';
import { createError, asyncHandler } from '@/middlewares/error.middleware';
import { loggers } from '@/utils/logger';
import { getRedisService } from '@/config/redis.config';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    username,
    email,
    password,
    fullName,
    phone,
    dateOfBirth,
    gender = 'OTHER'
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      $or: [{ email }, { username }]
    } as any
  });

  if (existingUser) {
    throw createError.conflict('User with this email or username already exists');
  }

  // Get member role (default for registration)
  const memberRole = await Role.findByName('MEMBER');
  if (!memberRole) {
    throw createError.internal('Member role not found');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    roleId: memberRole.id,
    username,
    email,
    passwordHash,
    phone,
    status: 'ACTIVE'
  });

  // Create user profile
  await UserProfile.create({
    userId: user.id,
    fullName,
    gender,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
  });

  // Load user with associations
  const newUser = await User.findByPk(user.id, {
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
    throw createError.internal('Failed to create user');
  }

  // Generate tokens
  const tokens = generateTokenPair(newUser);

  // Log registration
  loggers.auth.register(email, req.ip, true);

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
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Find user with role and profile
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description']
      },
      {
        model: UserProfile,
        as: 'profile',
        attributes: ['id', 'fullName', 'gender', 'avatarUrl'],
        required: false
      }
    ]
  });

  if (!user) {
    loggers.auth.login(0, email, req.ip, false);
    throw createError.unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.status || user.status !== 'ACTIVE') {
    loggers.auth.login(user.id, email, req.ip, false);
    throw createError.unauthorized('Account is not active');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    loggers.auth.login(user.id, email, req.ip, false);
    throw createError.unauthorized('Invalid email or password');
  }

  // Generate tokens before updating last login to preserve associations
  const tokens = generateTokenPair(user);

  // Update last login
  await user.updateLastLogin();

  // Log successful login
  loggers.auth.login(user.id, email, req.ip, true);

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
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError.unauthorized('No token provided');
  }

  const token = authHeader.substring(7);
  const user = req.user!;

  try {
    // Get token expiration time and blacklist it
    const exp = require('jsonwebtoken').decode(token)?.exp;
    if (exp) {
      await blacklistToken(token, exp);
    }

    // Log logout
    loggers.auth.logout(user.id, user.email);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    // Even if blacklisting fails, respond with success
    // The token will expire naturally
    loggers.auth.logout(user.id, user.email);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError.unauthorized('Refresh token is required');
  }

  // Verify refresh token
  const decoded = await verifyRefreshToken(refreshToken);

  // Find user
  const user = await User.findByPk(decoded.userId, {
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
    throw createError.unauthorized('Invalid refresh token');
  }

  // Generate new token pair
  const tokens = generateTokenPair(user);

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
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    res.json({
      success: true,
      message: 'If your email is registered, you will receive password reset instructions'
    });
    return;
  }

  // Generate password reset token
  const resetToken = generatePasswordResetToken(user.id, user.email);

  // Store reset token in Redis with expiration
  const redis = await getRedisService();
  await redis.set(`password_reset:${user.id}`, resetToken, 3600); // 1 hour

  // Log password reset request
  loggers.auth.passwordReset(email, req.ip);

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
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  // Verify reset token
  const { userId, email } = await verifyPasswordResetToken(token);

  // Check if token exists in Redis
  const redis = await getRedisService();
  const storedToken = await redis.get(`password_reset:${userId}`);

  if (!storedToken || storedToken !== token) {
    throw createError.unauthorized('Invalid or expired password reset token');
  }

  // Find user
  const user = await User.findByPk(userId);
  if (!user || user.email !== email) {
    throw createError.unauthorized('Invalid password reset token');
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update password
  await user.update({ passwordHash });

  // Remove reset token from Redis
  await redis.del(`password_reset:${userId}`);

  // Log password reset
  loggers.auth.passwordReset(email, req.ip);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw createError.unauthorized('Current password is incorrect');
  }

  // Check if new password is different
  const isSamePassword = await comparePassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw createError.validation('New password must be different from current password');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await user.update({ passwordHash });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Get user profile
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  // Get user with full profile data
  const fullUser = await User.findByPk(user.id, {
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
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    fullName,
    phone,
    dateOfBirth,
    gender,
    address,
    bio
  } = req.body;

  // Update user fields
  const userUpdateData: any = {};
  if (phone !== undefined) userUpdateData.phone = phone;

  if (Object.keys(userUpdateData).length > 0) {
    await user.update(userUpdateData);
  }

  // Update profile fields
  const profileUpdateData: any = {};
  if (fullName !== undefined) profileUpdateData.fullName = fullName;
  if (dateOfBirth !== undefined) profileUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  if (gender !== undefined) profileUpdateData.gender = gender;
  if (address !== undefined) profileUpdateData.address = address;
  if (bio !== undefined) profileUpdateData.bio = bio;

  if (Object.keys(profileUpdateData).length > 0) {
    await UserProfile.update(profileUpdateData, {
      where: { userId: user.id }
    });
  }

  // Get updated user
  const updatedUser = await User.findByPk(user.id, {
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

export default {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
};