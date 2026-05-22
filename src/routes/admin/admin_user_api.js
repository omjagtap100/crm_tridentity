import express from 'express';
import { UserService } from '../../entityManagers/user/UserService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';

export const admin_user_api = express.Router();

const ns = '/api/v1/admin/users';
const guard = [authMiddleware, roleMiddleware('super_admin')];

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users fetched
 */
// GET /api/v1/admin/users
admin_user_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const { tenantId, role, page, limit } = req.query;
        const result = await UserService.getAll({
            tenantId: tenantId ? parseInt(tenantId) : undefined,
            role,
            page,
            limit,
        });
        res.status(200).json(new ApiResponse(200, result, 'Users fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User fetched
 */
// GET /api/v1/admin/users/:id
admin_user_api.get(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await UserService.getById(parseInt(req.params.id));
        res.status(200).json(new ApiResponse(200, result, 'User fetched'));
    } catch (error) {
        next(error);
    }
});
