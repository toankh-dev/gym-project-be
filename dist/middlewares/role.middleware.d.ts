import { Request, Response, NextFunction } from 'express';
/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 */
export declare const roleGuard: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if user has admin role
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if user has admin or staff role
 */
export declare const requireAdminOrStaff: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if user has trainer role
 */
export declare const requireTrainer: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if user has member role
 */
export declare const requireMember: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if user has admin, staff, or trainer role
 */
export declare const requireStaffOrTrainer: (req: Request, res: Response, next: NextFunction) => void;
export default roleGuard;
//# sourceMappingURL=role.middleware.d.ts.map