import express from 'express';
import { FileService } from '../../entityManagers/file/FileService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';
import { uploadMiddleware } from '../../middleware/uploadMiddleware.js';

export const crm_file_api = express.Router();

const ns = '/api/v1/crm/files';
const guard = [authMiddleware, tenantMiddleware, roleMiddleware('merchant')];

/**
 * @swagger
 * /api/v1/crm/files:
 *   get:
 *     summary: Get all uploaded files
 *     tags: [CRM Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Files fetched
 */
// GET /api/v1/crm/files
crm_file_api.get(ns, ...guard, async (req, res, next) => {
    try {
        const files = await FileService.getAll(req.tenantId);
        res.status(200).json(new ApiResponse(200, files, 'Files fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/crm/files/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [CRM Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 */
// POST /api/v1/crm/files/upload
crm_file_api.post(`${ns}/upload`, ...guard, uploadMiddleware.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const file = await FileService.save(req.tenantId, req.file);
        res.status(201).json(new ApiResponse(201, file, 'File uploaded'));
    } catch (error) {
        next(error);
    }
});
