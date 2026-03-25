import express from 'express';
import { ProductService } from '../../entityManagers/product/ProductService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { optionalAuthMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware, getTenantFromDomain } from '../../middleware/tenantMiddleware.js';

export const store_product_api = express.Router();

const ns = '/api/v1/store/products';

/**
 * @swagger
 * /api/v1/store/products:
 *   get:
 *     summary: Browse products for a tenant
 *     tags: [Storefront]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Products fetched successfully
 */
// GET /api/v1/store/products
store_product_api.get(ns, optionalAuthMiddleware, tenantMiddleware, async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await ProductService.getAll(req.tenantId, { page, limit, visible: true });
        res.status(200).json(new ApiResponse(200, result, 'Products fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/store/products/{slug}:
 *   get:
 *     summary: Get a product by slug
 *     tags: [Storefront]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product fetched successfully
 */
// GET /api/v1/store/products/:slug
store_product_api.get(`${ns}/:slug`, optionalAuthMiddleware, tenantMiddleware, async (req, res, next) => {
    try {
        const result = await ProductService.getBySlug(req.tenantId, req.params.slug);
        res.status(200).json(new ApiResponse(200, result, 'Product fetched'));
    } catch (error) {
        next(error);
    }
});
