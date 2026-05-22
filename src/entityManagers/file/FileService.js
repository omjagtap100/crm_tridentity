import { MODELS } from '../../sequelize.js';
import { cosHelper } from '../../helper/TencentCosHelper.js';
import path from 'path';

export class FileService {

    /**
     * Upload a multer file to COS and save the resulting public URL in the files table.
     * Used by the generic crm_file_api upload.
     */
    static async save(tenantId, file) {
        const folder = `tenant_${tenantId}/files`;
        const result = await cosHelper.uploadFile(file.path, file.originalname, folder);
        return MODELS.File.create({ tenant_id: tenantId, url: result.fileUrl, type: file.mimetype });
    }


    static async saveUrl(tenantId, url, type = null) {
        return MODELS.File.create({ tenant_id: tenantId, url, type });
    }

    static async getAll(tenantId) {
        return MODELS.File.findAll({ where: { tenant_id: tenantId }, order: [['created_at', 'DESC']] });
    }
}
