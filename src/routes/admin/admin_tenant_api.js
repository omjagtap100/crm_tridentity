import express from 'express';
import { TenantService } from '../../entityManagers/tenant/TenantService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';
import { validateTenant, validateDomain } from '../../validators/tenant.validator.js';

export const admin_tenant_api = express.Router();

const ns = '/api/v1/admin/tenants';
const guard = [authMiddleware, roleMiddleware('super_admin')];

/**
 * @swagger
 * /api/v1/admin/tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Admin Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenants fetched
 */
// GET /api/v1/admin/tenants
admin_tenant_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const result = await TenantService.getAll();
        res.status(200).json(new ApiResponse(200, result, 'Tenants fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Admin Tenants]
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
 *         description: Tenant fetched
 */
// GET /api/v1/admin/tenants/:id
admin_tenant_api.get(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await TenantService.getById(parseInt(req.params.id));
        res.status(200).json(new ApiResponse(200, result, 'Tenant fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Admin Tenants]
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
 *         description: Tenant created
 */
// POST /api/v1/admin/tenants
admin_tenant_api.post(ns, ...guard, validateTenant, async (req, res, next) => {
    try {
        const result = await TenantService.create(req.body);
        res.status(201).json(new ApiResponse(201, result, 'Tenant created'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants/{id}:
 *   put:
 *     summary: Update a tenant
 *     tags: [Admin Tenants]
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
 *         description: Tenant updated
 */
// PUT /api/v1/admin/tenants/:id
admin_tenant_api.put(`${ns}/:id`, ...guard, validateTenant, async (req, res, next) => {
    try {
        const result = await TenantService.update(parseInt(req.params.id), req.body);
        res.status(200).json(new ApiResponse(200, result, 'Tenant updated'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants/{id}/status:
 *   patch:
 *     summary: Update tenant status
 *     tags: [Admin Tenants]
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
 *             required: [active]
 *             properties:
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tenant status updated
 */
// PATCH /api/v1/admin/tenants/:id/status
admin_tenant_api.patch(`${ns}/:id/status`, ...guard, async (req, res, next) => {
    try {
        const { active } = req.body;
        const result = await TenantService.setStatus(parseInt(req.params.id), active);
        res.status(200).json(new ApiResponse(200, result, 'Tenant status updated'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants/{id}:
 *   delete:
 *     summary: Delete a tenant
 *     tags: [Admin Tenants]
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
 *         description: Tenant deleted
 */
// DELETE /api/v1/admin/tenants/:id
admin_tenant_api.delete(`${ns}/:id`, ...guard, async (req, res, next) => {
    try {
        const result = await TenantService.delete(parseInt(req.params.id));
        res.status(200).json(new ApiResponse(200, result, 'Tenant deleted'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/tenants/{id}/domains:
 *   post:
 *     summary: Add domain to tenant
 *     tags: [Admin Tenants]
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
 *             required: [domain]
 *             properties:
 *               domain:
 *                 type: string
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Domain added
 */
// POST /api/v1/admin/tenants/:id/domains
admin_tenant_api.post(`${ns}/:id/domains`, ...guard, validateDomain, async (req, res, next) => {
    try {
        const result = await TenantService.addDomain(parseInt(req.params.id), req.body);
        res.status(201).json(new ApiResponse(201, result, 'Domain added'));
    } catch (error) {
        next(error);
    }
});
