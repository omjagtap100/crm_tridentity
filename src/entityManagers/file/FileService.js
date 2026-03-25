import { MODELS } from '../../sequelize.js';
import path from 'path';

export class FileService {

    static async save(tenantId, file) {
        const url = `/${file.path.replace(/\\/g, '/')}`;
        const type = file.mimetype;

        return MODELS.File.create({ tenant_id: tenantId, url, type });
    }

    static async getAll(tenantId) {
        return MODELS.File.findAll({ where: { tenant_id: tenantId }, order: [['created_at', 'DESC']] });
    }
}
