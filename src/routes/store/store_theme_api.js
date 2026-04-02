import express from 'express';
import { ThemeService } from '../../entityManagers/theme/ThemeService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';

export const store_theme_api = express.Router();

const ns = '/api/v1/store';

/**
 * @swagger
 * /api/v1/store/config:
 *   get:
 *     summary: Get full UI config for a storefront by domain name
 *     tags: [Storefront]
 *     parameters:
 *       - in: query
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: The exact domain string (e.g. shop.example.com or mystore)
 *     responses:
 *       200:
 *         description: Full UI config returned
 *       400:
 *         description: domain param missing
 *       404:
 *         description: Domain or tenant not found
 */
// GET /api/v1/store/config?domain=shop.example.com
store_theme_api.get(`${ns}/config`, async (req, res, next) => {
    try {
        const { domain } = req.query;
        const config = await ThemeService.getThemeByDomain(domain);
        res.status(200).json(new ApiResponse(200, config, 'Store config fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/store/theme:
 *   get:
 *     summary: Get storefront theme settings (resolved from subdomain/header)
 *     tags: [Storefront]
 *     responses:
 *       200:
 *         description: Theme fetched
 */
// GET /api/v1/store/theme  (legacy — subdomain/header resolution)
store_theme_api.get(`${ns}/theme`, tenantMiddleware, async (req, res, next) => {
    try {
        const theme = await ThemeService.getTheme(req.tenantId);
        const structured = ThemeService.toStructuredResponse(req.tenantId, null, theme);
        res.status(200).json(new ApiResponse(200, structured, 'Theme fetched'));
    } catch (error) {
        next(error);
    }
});
