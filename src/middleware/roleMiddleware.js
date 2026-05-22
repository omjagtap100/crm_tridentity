import { ApiError } from '../helper/ApiError.js';

/**
 * Factory: returns middleware that requires the user to have one of allowedRoles
 * Usage: roleMiddleware('merchant') or roleMiddleware('super_admin', 'merchant')
 */
export const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(new ApiError(401, 'Unauthorized'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(new ApiError(403, `Access denied. Required role: ${allowedRoles.join(' or ')}`));
        }
        next();
    };
};
