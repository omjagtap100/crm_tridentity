import express from 'express';
import { ThemeService } from '../../entityManagers/theme/ThemeService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';

export const crm_theme_api = express.Router();

const ns = '/api/v1/crm/theme';
const guard = [authMiddleware, tenantMiddleware, roleMiddleware('merchant')];

/**
 * @swagger
 * /api/v1/crm/theme:
 *   get:
 *     summary: Get theme settings
 *     tags: [CRM Theme]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Theme fetched
 */
// GET /api/v1/crm/theme
crm_theme_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const result = await ThemeService.getTheme(req.tenantId);
        res.status(200).json(new ApiResponse(200, result, 'Theme fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/theme:
 *   put:
 *     summary: Update theme settings
 *     tags: [CRM Theme]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primary_color:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               banner_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Theme updated
 */
// PUT /api/v1/crm/theme
crm_theme_api.put(ns, ...guard, async (req, res, next) => {
    try {
        const result = await ThemeService.upsertTheme(req.tenantId, req.body);
        res.status(200).json(new ApiResponse(200, result, 'Theme updated'));
    } catch (error) {
        next(error);
    }
});
