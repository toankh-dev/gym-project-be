export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateRandomPassword: (length?: number) => string;
export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    score: number;
}
export declare const validatePasswordStrength: (password: string) => PasswordValidation;
export declare const isPasswordValid: (password: string) => boolean;
export declare const generateTempPassword: () => string;
export declare const passwordUtils: {
    isValidHash: (hash: string) => boolean;
    getHashInfo: (hash: string) => {
        algorithm: string;
        rounds: number;
    };
    estimateCrackTime: (password: string) => string;
    getStrengthTips: () => string[];
};
export declare const passwordHistory: {
    wasUsedRecently: (userId: number, newPasswordHash: string) => Promise<boolean>;
    addToHistory: (userId: number, passwordHash: string) => Promise<void>;
    cleanOldHistory: (userId: number, keepLast?: number) => Promise<void>;
};
declare const _default: {
    hashPassword: (password: string) => Promise<string>;
    comparePassword: (password: string, hash: string) => Promise<boolean>;
    generateRandomPassword: (length?: number) => string;
    validatePasswordStrength: (password: string) => PasswordValidation;
    isPasswordValid: (password: string) => boolean;
    generateTempPassword: () => string;
    passwordUtils: {
        isValidHash: (hash: string) => boolean;
        getHashInfo: (hash: string) => {
            algorithm: string;
            rounds: number;
        };
        estimateCrackTime: (password: string) => string;
        getStrengthTips: () => string[];
    };
    passwordHistory: {
        wasUsedRecently: (userId: number, newPasswordHash: string) => Promise<boolean>;
        addToHistory: (userId: number, passwordHash: string) => Promise<void>;
        cleanOldHistory: (userId: number, keepLast?: number) => Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=password.d.ts.map