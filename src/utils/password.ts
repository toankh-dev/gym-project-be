import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    logger.debug('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

// Compare password with hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hash);

    logger.debug(`Password comparison result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Failed to compare password');
  }
};

// Generate random password
export const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one character from each category
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Validate password strength
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export const validatePasswordStrength = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common pattern checks
  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot contain only repeated characters');
    score = Math.max(0, score - 2);
  }

  if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/.test(password.toLowerCase())) {
    errors.push('Password cannot contain common sequences');
    score = Math.max(0, score - 1);
  }

  // Common passwords check (basic)
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
    score = 0;
  }

  // Determine strength
  let strength: PasswordValidation['strength'];
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else if (score <= 5) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
};

// Check if password meets minimum requirements
export const isPasswordValid = (password: string): boolean => {
  const validation = validatePasswordStrength(password);
  return validation.isValid;
};

// Generate secure temporary password
export const generateTempPassword = (): string => {
  return generateRandomPassword(10);
};

// Password utilities
export const passwordUtils = {
  // Check if hash is valid bcrypt hash
  isValidHash: (hash: string): boolean => {
    return /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(hash);
  },

  // Get hash info (rounds, algorithm)
  getHashInfo: (hash: string) => {
    const match = hash.match(/^\$2([aby])\$(\d{1,2})\$/);
    if (!match) return null;

    return {
      algorithm: `bcrypt-${match[1]}`,
      rounds: parseInt(match[2], 10)
    };
  },

  // Estimate time to crack password (very basic)
  estimateCrackTime: (password: string): string => {
    const validation = validatePasswordStrength(password);

    switch (validation.strength) {
      case 'weak':
        return 'Less than 1 minute';
      case 'medium':
        return 'A few hours to days';
      case 'strong':
        return 'Several years';
      case 'very-strong':
        return 'Centuries';
      default:
        return 'Unknown';
    }
  },

  // Password strength tips
  getStrengthTips: (): string[] => {
    return [
      'Use at least 12 characters',
      'Include uppercase and lowercase letters',
      'Add numbers and special characters',
      'Avoid common words and patterns',
      'Don\'t use personal information',
      'Consider using a passphrase',
      'Use a unique password for each account'
    ];
  }
};

// Password history management (for preventing reuse)
export const passwordHistory = {
  // Check if password was used recently (would need to store hashes)
  wasUsedRecently: async (userId: number, newPasswordHash: string): Promise<boolean> => {
    // This would typically check against a password_history table
    // For now, return false as placeholder
    return false;
  },

  // Add password to history
  addToHistory: async (userId: number, passwordHash: string): Promise<void> => {
    // This would typically insert into password_history table
    // Implementation depends on business requirements (how many to keep)
    logger.debug(`Adding password to history for user ${userId}`);
  },

  // Clean old password history
  cleanOldHistory: async (userId: number, keepLast: number = 5): Promise<void> => {
    // This would typically clean old entries keeping only the last N passwords
    logger.debug(`Cleaning password history for user ${userId}, keeping last ${keepLast}`);
  }
};

export default {
  hashPassword,
  comparePassword,
  generateRandomPassword,
  validatePasswordStrength,
  isPasswordValid,
  generateTempPassword,
  passwordUtils,
  passwordHistory
};