import jwt from 'jsonwebtoken';
import { User } from '@/models/User.model';
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
export declare const generateAccessToken: (user: User) => string;
export declare const generateRefreshToken: (user: User) => string;
export declare const generateTokenPair: (user: User) => TokenPair;
export declare const verifyAccessToken: (token: string) => Promise<JwtPayload>;
export declare const verifyRefreshToken: (token: string) => Promise<JwtPayload>;
export declare const getTokenExpirationTime: (token: string) => number | null;
export declare const isTokenExpired: (token: string) => boolean;
export declare const getTimeUntilExpiry: (token: string) => number;
export declare const extractUserFromToken: (token: string) => Partial<JwtPayload> | null;
export declare const generatePasswordResetToken: (userId: number, email: string) => string;
export declare const verifyPasswordResetToken: (token: string) => Promise<{
    userId: number;
    email: string;
}>;
export declare const generateEmailVerificationToken: (userId: number, email: string) => string;
export declare const verifyEmailVerificationToken: (token: string) => Promise<{
    userId: number;
    email: string;
}>;
export declare const tokenUtils: {
    decode: (token: string) => string | jwt.JwtPayload;
    getHeader: (token: string) => jwt.JwtHeader;
    getPayload: (token: string) => string | jwt.JwtPayload;
    isValidFormat: (token: string) => boolean;
};
declare const _default: {
    generateAccessToken: (user: User) => string;
    generateRefreshToken: (user: User) => string;
    generateTokenPair: (user: User) => TokenPair;
    verifyAccessToken: (token: string) => Promise<JwtPayload>;
    verifyRefreshToken: (token: string) => Promise<JwtPayload>;
    generatePasswordResetToken: (userId: number, email: string) => string;
    verifyPasswordResetToken: (token: string) => Promise<{
        userId: number;
        email: string;
    }>;
    generateEmailVerificationToken: (userId: number, email: string) => string;
    verifyEmailVerificationToken: (token: string) => Promise<{
        userId: number;
        email: string;
    }>;
    getTokenExpirationTime: (token: string) => number | null;
    isTokenExpired: (token: string) => boolean;
    getTimeUntilExpiry: (token: string) => number;
    extractUserFromToken: (token: string) => Partial<JwtPayload> | null;
    tokenUtils: {
        decode: (token: string) => string | jwt.JwtPayload;
        getHeader: (token: string) => jwt.JwtHeader;
        getPayload: (token: string) => string | jwt.JwtPayload;
        isValidFormat: (token: string) => boolean;
    };
};
export default _default;
//# sourceMappingURL=jwt.d.ts.map