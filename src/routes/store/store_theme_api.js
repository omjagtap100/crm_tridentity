import express from 'express';
import { ThemeService } from '../../entityManagers/theme/ThemeService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';

export const store_theme_api = express.Router();

const ns = '/api/v1/store/theme';

/**
 * @swagger
 * /api/v1/store/theme:
 *   get:
 *     summary: Get storefront theme settings
 *     tags: [Storefront]
 *     responses:
 *       200:
 *         description: Theme fetched
 */
// GET /api/v1/store/theme
store_theme_api.get(ns, tenantMiddleware, async (req, res, next) => {
    try {
        const theme = await ThemeService.getTheme(req.tenantId);
        res.status(200).json(new ApiResponse(200, theme, 'Theme fetched'));
    } catch (error) {
        next(error);
    }
});
