import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
}
export declare class CustomError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError400 extends CustomError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends CustomError {
    constructor(message?: string);
}
export declare class ForbiddenError extends CustomError {
    constructor(message?: string);
}
export declare class NotFoundError extends CustomError {
    constructor(message?: string);
}
export declare class ConflictError extends CustomError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends CustomError {
    constructor(message?: string);
}
export declare class InternalServerError extends CustomError {
    constructor(message?: string);
}
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: {
    validation: (message: string, details?: any) => ValidationError400;
    unauthorized: (message?: string) => UnauthorizedError;
    forbidden: (message?: string) => ForbiddenError;
    notFound: (resource?: string) => NotFoundError;
    conflict: (message?: string) => ConflictError;
    tooManyRequests: (message?: string) => TooManyRequestsError;
    internal: (message?: string) => InternalServerError;
};
export default errorHandler;
//# sourceMappingURL=error.middleware.d.ts.map