import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User.model';
declare global {
    namespace Express {
        interface Request {
            user?: User;
            session?: {
                userId?: number;
                role?: string;
            };
        }
    }
}
export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const selfOrAdmin: (getUserId: (req: Request) => number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const checkResourceOwnership: (getResourceOwner: (req: Request) => Promise<number>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitByUser: (maxRequests?: number, windowMinutes?: number) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const blacklistToken: (token: string, expirationTime?: number) => Promise<void>;
declare const _default: {
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    authorize: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    selfOrAdmin: (getUserId: (req: Request) => number) => (req: Request, res: Response, next: NextFunction) => void;
    checkResourceOwnership: (getResourceOwner: (req: Request) => Promise<number>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    rateLimitByUser: (maxRequests?: number, windowMinutes?: number) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    blacklistToken: (token: string, expirationTime?: number) => Promise<void>;
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map