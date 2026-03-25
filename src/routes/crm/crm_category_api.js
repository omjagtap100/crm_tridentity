import express from 'express';
import { CategoryService } from '../../entityManagers/category/CategoryService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';

export const crm_category_api = express.Router();

const ns = '/api/v1/crm/categories';
const guard = [authMiddleware, tenantMiddleware, roleMiddleware('merchant')];

/**
 * @swagger
 * /api/v1/crm/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [CRM Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched
 */
crm_category_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const result = await CategoryService.getAll(req.tenantId);
        res.status(200).json(new ApiResponse(200, result, 'Categories fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/categories:
 *   post:
 *     summary: Create a category
 *     tags: [CRM Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
crm_category_api.post(ns, ...guard, async (req, res, next) => {
    try {
        const result = await CategoryService.create(req.tenantId, req.body);
        res.status(201).json(new ApiResponse(201, result, 'Category created'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [CRM Categories]
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
 *     responses:
 *       200:
 *         description: Category updated
 */
crm_category_api.put(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await CategoryService.update(req.tenantId, parseInt(req.params.id), req.body);
        res.status(200).json(new ApiResponse(200, result, 'Category updated'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [CRM Categories]
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
 *         description: Category deleted
 */
crm_category_api.delete(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await CategoryService.delete(req.tenantId, parseInt(req.params.id));
        res.status(200).json(new ApiResponse(200, result, 'Category deleted'));
    } catch (error) {
        next(error);
    }
});
