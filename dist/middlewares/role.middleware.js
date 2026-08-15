"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStaffOrTrainer = exports.requireMember = exports.requireTrainer = exports.requireAdminOrStaff = exports.requireAdmin = exports.roleGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 */
const roleGuard = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const authReq = req;
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
            let userRole;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.substring(7);
                    const decoded = jsonwebtoken_1.default.decode(token);
                    userRole = decoded?.role;
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Role guard error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during role verification'
            });
        }
    };
};
exports.roleGuard = roleGuard;
/**
 * Check if user has admin role
 */
exports.requireAdmin = (0, exports.roleGuard)(['ADMIN']);
/**
 * Check if user has admin or staff role
 */
exports.requireAdminOrStaff = (0, exports.roleGuard)(['ADMIN', 'STAFF']);
/**
 * Check if user has trainer role
 */
exports.requireTrainer = (0, exports.roleGuard)(['TRAINER']);
/**
 * Check if user has member role
 */
exports.requireMember = (0, exports.roleGuard)(['MEMBER']);
/**
 * Check if user has admin, staff, or trainer role
 */
exports.requireStaffOrTrainer = (0, exports.roleGuard)(['ADMIN', 'STAFF', 'TRAINER']);
exports.default = exports.roleGuard;
//# sourceMappingURL=role.middleware.js.map