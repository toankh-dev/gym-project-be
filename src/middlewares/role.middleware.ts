import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 */
export const roleGuard = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Check if user exists (should be set by auth middleware)
      if (!authReq.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Extract role from JWT token directly since Sequelize associations are problematic
      const authHeader = req.headers.authorization;
      let userRole: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.decode(token) as any;
          userRole = decoded?.role;
        } catch (error) {
          console.error('Error decoding JWT in role middleware:', error);
        }
      }

      // Check if user has role information
      if (!userRole) {
        res.status(403).json({
          success: false,
          message: 'Role information not found'
        });
        return;
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
        });
        return;
      }

      // User has required role, continue to next middleware
      next();
    } catch (error) {
      console.error('Role guard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during role verification'
      });
    }
  };
};

/**
 * Check if user has admin role
 */
export const requireAdmin = roleGuard(['ADMIN']);

/**
 * Check if user has admin or staff role
 */
export const requireAdminOrStaff = roleGuard(['ADMIN', 'STAFF']);

/**
 * Check if user has trainer role
 */
export const requireTrainer = roleGuard(['TRAINER']);

/**
 * Check if user has member role
 */
export const requireMember = roleGuard(['MEMBER']);

/**
 * Check if user has admin, staff, or trainer role
 */
export const requireStaffOrTrainer = roleGuard(['ADMIN', 'STAFF', 'TRAINER']);

export default roleGuard;