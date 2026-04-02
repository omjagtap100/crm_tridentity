import express from 'express';
import { UserService } from '../../entityManagers/user/UserService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';

export const crm_user_api = express.Router();

const ns = '/api/v1/crm/users';
const guard = [authMiddleware, tenantMiddleware, roleMiddleware('merchant', 'super_admin')];

/**
 * @swagger
 * /api/v1/crm/users:
 *   get:
 *     summary: Get all users
 *     tags: [CRM Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched
 */
crm_user_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const result = await UserService.getAll({ tenantId: req.tenantId, role: 'customer' });
        res.status(200).json(new ApiResponse(200, result, 'Users fetched'));
    } catch (error) {
        next(error);
    }
});