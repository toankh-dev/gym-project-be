import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const customValidations: {
    isValidDate: (value: string) => boolean;
    isValidPhone: (value: string) => boolean;
    isValidTime: (value: string) => boolean;
    isEndTimeAfterStartTime: (startTime: string, endTime: string) => boolean;
    isFutureDate: (value: string) => boolean;
    isBirthDateValid: (value: string) => boolean;
    isStrongPassword: (password: string) => boolean;
    isAllowedEmailDomain: (email: string, allowedDomains?: string[]) => boolean;
    isUsernameAvailable: (username: string) => Promise<boolean>;
    isEmailAvailable: (email: string) => Promise<boolean>;
    isValidAmount: (value: number, min?: number, max?: number) => boolean;
    hasUniqueValues: (array: any[]) => boolean;
    hasAllowedCharacters: (value: string, allowedPattern: RegExp) => boolean;
    isAllowedFileType: (filename: string, allowedTypes: string[]) => boolean;
    isFileSizeValid: (size: number, maxSize?: number) => boolean;
};
export declare const commonValidationRules: {
    idParam: {
        in: string[];
        isInt: {
            options: {
                min: number;
            };
            errorMessage: string;
        };
        toInt: boolean;
    };
    page: {
        in: string[];
        optional: boolean;
        isInt: {
            options: {
                min: number;
            };
            errorMessage: string;
        };
        toInt: boolean;
    };
    limit: {
        in: string[];
        optional: boolean;
        isInt: {
            options: {
                min: number;
                max: number;
            };
            errorMessage: string;
        };
        toInt: boolean;
    };
    sortBy: {
        in: string[];
        optional: boolean;
        isString: boolean;
        trim: boolean;
    };
    sortOrder: {
        in: string[];
        optional: boolean;
        isIn: {
            options: string[][];
            errorMessage: string;
        };
    };
    search: {
        in: string[];
        optional: boolean;
        isString: boolean;
        trim: boolean;
        isLength: {
            options: {
                min: number;
                max: number;
            };
            errorMessage: string;
        };
    };
    startDate: {
        in: string[];
        optional: boolean;
        isISO8601: {
            errorMessage: string;
        };
    };
    endDate: {
        in: string[];
        optional: boolean;
        isISO8601: {
            errorMessage: string;
        };
    };
    status: {
        in: string[];
        optional: boolean;
        isString: boolean;
        trim: boolean;
    };
};
export declare const formatValidationErrors: (errors: ValidationError[]) => any[];
export declare const sanitize: {
    cleanString: (value: string) => string;
    escapeSpecialChars: (value: string) => string;
    formatPhoneNumber: (phone: string) => string;
    normalizeEmail: (email: string) => string;
    normalizeText: (text: string) => string;
};
declare const _default: {
    validateRequest: (req: Request, res: Response, next: NextFunction) => void;
    customValidations: {
        isValidDate: (value: string) => boolean;
        isValidPhone: (value: string) => boolean;
        isValidTime: (value: string) => boolean;
        isEndTimeAfterStartTime: (startTime: string, endTime: string) => boolean;
        isFutureDate: (value: string) => boolean;
        isBirthDateValid: (value: string) => boolean;
        isStrongPassword: (password: string) => boolean;
        isAllowedEmailDomain: (email: string, allowedDomains?: string[]) => boolean;
        isUsernameAvailable: (username: string) => Promise<boolean>;
        isEmailAvailable: (email: string) => Promise<boolean>;
        isValidAmount: (value: number, min?: number, max?: number) => boolean;
        hasUniqueValues: (array: any[]) => boolean;
        hasAllowedCharacters: (value: string, allowedPattern: RegExp) => boolean;
        isAllowedFileType: (filename: string, allowedTypes: string[]) => boolean;
        isFileSizeValid: (size: number, maxSize?: number) => boolean;
    };
    commonValidationRules: {
        idParam: {
            in: string[];
            isInt: {
                options: {
                    min: number;
                };
                errorMessage: string;
            };
            toInt: boolean;
        };
        page: {
            in: string[];
            optional: boolean;
            isInt: {
                options: {
                    min: number;
                };
                errorMessage: string;
            };
            toInt: boolean;
        };
        limit: {
            in: string[];
            optional: boolean;
            isInt: {
                options: {
                    min: number;
                    max: number;
                };
                errorMessage: string;
            };
            toInt: boolean;
        };
        sortBy: {
            in: string[];
            optional: boolean;
            isString: boolean;
            trim: boolean;
        };
        sortOrder: {
            in: string[];
            optional: boolean;
            isIn: {
                options: string[][];
                errorMessage: string;
            };
        };
        search: {
            in: string[];
            optional: boolean;
            isString: boolean;
            trim: boolean;
            isLength: {
                options: {
                    min: number;
                    max: number;
                };
                errorMessage: string;
            };
        };
        startDate: {
            in: string[];
            optional: boolean;
            isISO8601: {
                errorMessage: string;
            };
        };
        endDate: {
            in: string[];
            optional: boolean;
            isISO8601: {
                errorMessage: string;
            };
        };
        status: {
            in: string[];
            optional: boolean;
            isString: boolean;
            trim: boolean;
        };
    };
    formatValidationErrors: (errors: ValidationError[]) => any[];
    sanitize: {
        cleanString: (value: string) => string;
        escapeSpecialChars: (value: string) => string;
        formatPhoneNumber: (phone: string) => string;
        normalizeEmail: (email: string) => string;
        normalizeText: (text: string) => string;
    };
};
export default _default;
//# sourceMappingURL=validation.middleware.d.ts.map