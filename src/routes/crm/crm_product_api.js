import express from 'express';
import { ProductService } from '../../entityManagers/product/ProductService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';
import { validateProduct, validateProductUpdate } from '../../validators/product.validator.js';

export const crm_product_api = express.Router();

const ns = '/api/v1/crm/products';
const guard = [authMiddleware, tenantMiddleware, roleMiddleware('merchant')];

/**
 * @swagger
 * /api/v1/crm/products:
 *   get:
 *     summary: Get all products for the tenant
 *     tags: [CRM Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Products fetched
 */
// GET /api/v1/crm/products
crm_product_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await ProductService.getAll(req.tenantId, { page, limit });
        res.status(200).json(new ApiResponse(200, result, 'Products fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [CRM Products]
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
 *         description: Product fetched
 */
// GET /api/v1/crm/products/:id
crm_product_api.get(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await ProductService.getById(req.tenantId, parseInt(req.params.id));
        res.status(200).json(new ApiResponse(200, result, 'Product fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/products:
 *   post:
 *     summary: Create a product
 *     tags: [CRM Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock, slug]
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               slug:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Product created
 */
// POST /api/v1/crm/products
crm_product_api.post(ns, ...guard, validateProduct, async (req, res, next) => {
    try {
        const result = await ProductService.create(req.tenantId, req.body);
        res.status(201).json(new ApiResponse(201, result, 'Product created'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [CRM Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated
 */
// PUT /api/v1/crm/products/:id
crm_product_api.put(`${ns}/:id`, ...guard, validateProductUpdate, async (req, res, next) => {
    try {
        const result = await ProductService.update(req.tenantId, parseInt(req.params.id), req.body);
        res.status(200).json(new ApiResponse(200, result, 'Product updated'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [CRM Products]
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
 *         description: Product deleted
 */
// DELETE /api/v1/crm/products/:id
crm_product_api.delete(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await ProductService.delete(req.tenantId, parseInt(req.params.id));
        res.status(200).json(new ApiResponse(200, result, 'Product deleted'));
    } catch (error) {
        next(error);
    }
});
