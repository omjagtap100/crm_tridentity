import express from 'express';
import { ThemeService } from '../../entityManagers/theme/ThemeService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';

export const admin_theme_api = express.Router();

const ns = '/api/v1/admin/tenants';
const guard = [authMiddleware, roleMiddleware('super_admin')];

/**
 * @swagger
 * /api/v1/admin/tenants/{id}/theme:
 *   get:
 *     summary: Get full theme/UI config for a tenant
 *     tags: [Admin Theme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Theme config fetched
 */
// GET /api/v1/admin/tenants/:id/theme
admin_theme_api.get(`${ns}/:id/theme`, ...guard, async (req, res, next) => {
    try {
        const tenantId = parseInt(req.params.id);
        const theme = await ThemeService.getTheme(tenantId);
        const structured = ThemeService.toStructuredResponse(tenantId, null, theme);
        res.status(200).json(new ApiResponse(200, structured, 'Theme fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants/{id}/theme:
 *   put:
 *     summary: Upsert full theme/UI config for a tenant
 *     tags: [Admin Theme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               store_name:
 *                 type: string
 *               store_tagline:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               favicon_url:
 *                 type: string
 *               primary_color:
 *                 type: string
 *               accent_color:
 *                 type: string
 *               background_style:
 *                 type: string
 *                 enum: [light, dark, gradient]
 *               font_family:
 *                 type: string
 *               banner_url:
 *                 type: string
 *               hero_config:
 *                 type: object
 *                 properties:
 *                   promo_badge:
 *                     type: string
 *                   headline:
 *                     type: string
 *                   sub_headline:
 *                     type: string
 *                   hero_image_url:
 *                     type: string
 *               layout_config:
 *                 type: object
 *                 properties:
 *                   show_hero:
 *                     type: boolean
 *                   show_trust_signals:
 *                     type: boolean
 *                   show_featured_products:
 *                     type: boolean
 *               social_links:
 *                 type: object
 *                 properties:
 *                   facebook:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   youtube:
 *                     type: string
 *                   linkedin:
 *                     type: string
 *               contact_info:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *               copyright_text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Theme config saved
 */
// PUT /api/v1/admin/tenants/:id/theme
admin_theme_api.put(`${ns}/:id/theme`, ...guard, async (req, res, next) => {
    try {
        const tenantId = parseInt(req.params.id);
        const theme = await ThemeService.upsertTheme(tenantId, req.body);
        const structured = ThemeService.toStructuredResponse(tenantId, null, theme);
        res.status(200).json(new ApiResponse(200, structured, 'Theme saved'));
    } catch (error) {
        next(error);
    }
});
