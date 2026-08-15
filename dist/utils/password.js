"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordHistory = exports.passwordUtils = exports.generateTempPassword = exports.isPasswordValid = exports.validatePasswordStrength = exports.generateRandomPassword = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("@/utils/logger");
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
// Hash password
const hashPassword = async (password) => {
    try {
        const salt = await bcryptjs_1.default.genSalt(BCRYPT_ROUNDS);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        logger_1.logger.debug('Password hashed successfully');
        return hashedPassword;
    }
    catch (error) {
        logger_1.logger.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};
exports.hashPassword = hashPassword;
// Compare password with hash
const comparePassword = async (password, hash) => {
    try {
        const isMatch = await bcryptjs_1.default.compare(password, hash);
        logger_1.logger.debug(`Password comparison result: ${isMatch}`);
        return isMatch;
    }
    catch (error) {
        logger_1.logger.error('Error comparing password:', error);
        throw new Error('Failed to compare password');
    }
};
exports.comparePassword = comparePassword;
// Generate random password
const generateRandomPassword = (length = 12) => {
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
exports.generateRandomPassword = generateRandomPassword;
const validatePasswordStrength = (password) => {
    const errors = [];
    let score = 0;
    // Length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    else if (password.length >= 8) {
        score += 1;
    }
    if (password.length >= 12) {
        score += 1;
    }
    // Lowercase check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    else {
        score += 1;
    }
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    else {
        score += 1;
    }
    // Number check
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    else {
        score += 1;
    }
    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    else {
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
    let strength;
    if (score <= 2) {
        strength = 'weak';
    }
    else if (score <= 4) {
        strength = 'medium';
    }
    else if (score <= 5) {
        strength = 'strong';
    }
    else {
        strength = 'very-strong';
    }
    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
// Check if password meets minimum requirements
const isPasswordValid = (password) => {
    const validation = (0, exports.validatePasswordStrength)(password);
    return validation.isValid;
};
exports.isPasswordValid = isPasswordValid;
// Generate secure temporary password
const generateTempPassword = () => {
    return (0, exports.generateRandomPassword)(10);
};
exports.generateTempPassword = generateTempPassword;
// Password utilities
exports.passwordUtils = {
    // Check if hash is valid bcrypt hash
    isValidHash: (hash) => {
        return /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(hash);
    },
    // Get hash info (rounds, algorithm)
    getHashInfo: (hash) => {
        const match = hash.match(/^\$2([aby])\$(\d{1,2})\$/);
        if (!match)
            return null;
        return {
            algorithm: `bcrypt-${match[1]}`,
            rounds: parseInt(match[2], 10)
        };
    },
    // Estimate time to crack password (very basic)
    estimateCrackTime: (password) => {
        const validation = (0, exports.validatePasswordStrength)(password);
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
    getStrengthTips: () => {
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
exports.passwordHistory = {
    // Check if password was used recently (would need to store hashes)
    wasUsedRecently: async (userId, newPasswordHash) => {
        // This would typically check against a password_history table
        // For now, return false as placeholder
        return false;
    },
    // Add password to history
    addToHistory: async (userId, passwordHash) => {
        // This would typically insert into password_history table
        // Implementation depends on business requirements (how many to keep)
        logger_1.logger.debug(`Adding password to history for user ${userId}`);
    },
    // Clean old password history
    cleanOldHistory: async (userId, keepLast = 5) => {
        // This would typically clean old entries keeping only the last N passwords
        logger_1.logger.debug(`Cleaning password history for user ${userId}, keeping last ${keepLast}`);
    }
};
exports.default = {
    hashPassword: exports.hashPassword,
    comparePassword: exports.comparePassword,
    generateRandomPassword: exports.generateRandomPassword,
    validatePasswordStrength: exports.validatePasswordStrength,
    isPasswordValid: exports.isPasswordValid,
    generateTempPassword: exports.generateTempPassword,
    passwordUtils: exports.passwordUtils,
    passwordHistory: exports.passwordHistory
};
//# sourceMappingURL=password.js.map