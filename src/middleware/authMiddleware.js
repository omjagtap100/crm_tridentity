import { getTokenFromHeader } from '../helper/BearerHelper.js';
import { verifyAccessToken } from '../helper/JwtHelper.js';
import { ApiError } from '../helper/ApiError.js';

export const authMiddleware = (req, res, next) => {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            throw new ApiError(401, 'Access token is required');
        }

        const claims = verifyAccessToken(token);
        req.user = claims; // { userId, tenantId, role }
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error);
        }
        return res.status(401).json(new ApiError(401, 'Invalid or expired token'));
    }
};

export const optionalAuthMiddleware = (req, res, next) => {
    try {
        const token = getTokenFromHeader(req);
        if (token) {
            const claims = verifyAccessToken(token);
            req.user = claims;
        }
        next();
    } catch {
        // Token invalid — continue as guest
        next();
    }
};
