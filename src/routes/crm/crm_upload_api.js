import express from 'express';
import { cosHelper } from '../../helper/TencentCosHelper.js';
import { FileService } from '../../entityManagers/file/FileService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { ApiError } from '../../helper/ApiError.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';
import { roleMiddleware } from '../../middleware/roleMiddleware.js';
import { uploadMiddleware } from '../../middleware/uploadMiddleware.js';

export const crm_upload_api = express.Router();

const guard = [authMiddleware, tenantMiddleware, roleMiddleware('merchant')];

// ---------------------------------------------------------------------------
// Helper: upload one file to COS, save record in `files` table, return URL
// ---------------------------------------------------------------------------
async function uploadOne(file, folder, tenantId) {
    const result = await cosHelper.uploadFile(file.path, file.originalname, folder);
    await FileService.saveUrl(tenantId, result.fileUrl, file.mimetype);
    return result.fileUrl;
}

// ---------------------------------------------------------------------------
// POST /api/v1/crm/upload/product-images
// Field: images (up to 10 files)
// Returns: array of uploaded URLs
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /api/v1/crm/upload/product-images:
 *   post:
 *     summary: Upload product images (up to 10)
 *     tags: [CRM Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded. Returns array of public URLs.
 */
crm_upload_api.post(
    '/api/v1/crm/upload/product-images',
    ...guard,
    uploadMiddleware.array('images', 10),
    async (req, res, next) => {
        try {
            if (!req.files || req.files.length === 0) {
                throw new ApiError(400, 'No images provided. Use field name: images');
            }
            const folder = `tenant_${req.tenantId}/products`;
            const urls = await Promise.all(
                req.files.map((f) => uploadOne(f, folder, req.tenantId))
            );
            res.status(201).json(new ApiResponse(201, { urls }, `${urls.length} image(s) uploaded`));
        } catch (error) {
            next(error);
        }
    }
);

// ---------------------------------------------------------------------------
// POST /api/v1/crm/upload/theme-logo
// Field: file (single)
// Returns: logo URL — ready to be saved to theme_settings.logo_url
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /api/v1/crm/upload/theme-logo:
 *   post:
 *     summary: Upload store logo
 *     tags: [CRM Uploads]
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
 *         description: Logo uploaded. Use returned url in PUT /api/v1/admin/tenants/:id/theme { logo_url }
 */
crm_upload_api.post(
    '/api/v1/crm/upload/theme-logo',
    ...guard,
    uploadMiddleware.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) throw new ApiError(400, 'No file uploaded. Use field name: file');
            const folder = `tenant_${req.tenantId}/theme`;
            const url = await uploadOne(req.file, folder, req.tenantId);
            res.status(201).json(new ApiResponse(201, { url, field: 'logo_url' }, 'Logo uploaded'));
        } catch (error) {
            next(error);
        }
    }
);

// ---------------------------------------------------------------------------
// POST /api/v1/crm/upload/theme-favicon
// Field: file (single)
// Returns: favicon URL — ready to be saved to theme_settings.favicon_url
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /api/v1/crm/upload/theme-favicon:
 *   post:
 *     summary: Upload store favicon
 *     tags: [CRM Uploads]
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
 *         description: Favicon uploaded. Use returned url in PUT /api/v1/admin/tenants/:id/theme { favicon_url }
 */
crm_upload_api.post(
    '/api/v1/crm/upload/theme-favicon',
    ...guard,
    uploadMiddleware.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) throw new ApiError(400, 'No file uploaded. Use field name: file');
            const folder = `tenant_${req.tenantId}/theme`;
            const url = await uploadOne(req.file, folder, req.tenantId);
            res.status(201).json(new ApiResponse(201, { url, field: 'favicon_url' }, 'Favicon uploaded'));
        } catch (error) {
            next(error);
        }
    }
);

// ---------------------------------------------------------------------------
// POST /api/v1/crm/upload/theme-banner
// Field: file (single)
// Returns: banner URL — ready to be saved to theme_settings.banner_url
//          or inside hero_config.hero_image_url
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /api/v1/crm/upload/theme-banner:
 *   post:
 *     summary: Upload hero/banner image
 *     tags: [CRM Uploads]
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
 *         description: Banner uploaded. Use returned url in PUT /api/v1/admin/tenants/:id/theme { banner_url or hero_config.hero_image_url }
 */
crm_upload_api.post(
    '/api/v1/crm/upload/theme-banner',
    ...guard,
    uploadMiddleware.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) throw new ApiError(400, 'No file uploaded. Use field name: file');
            const folder = `tenant_${req.tenantId}/theme`;
            const url = await uploadOne(req.file, folder, req.tenantId);
            res.status(201).json(new ApiResponse(201, { url, field: 'banner_url' }, 'Banner uploaded'));
        } catch (error) {
            next(error);
        }
    }
);
