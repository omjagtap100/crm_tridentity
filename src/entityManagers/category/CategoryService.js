import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';

export class CategoryService {

    static async getAll(tenantId) {
        return MODELS.Category.findAll({ where: { tenant_id: tenantId } });
    }

    static async getById(tenantId, id) {
        const cat = await MODELS.Category.findOne({ where: { id, tenant_id: tenantId } });
        if (!cat) throw new ApiError(404, 'Category not found');
        return cat;
    }

    static async create(tenantId, { name }) {
        return MODELS.Category.create({ tenant_id: tenantId, name });
    }

    static async update(tenantId, id, { name }) {
        const cat = await CategoryService.getById(tenantId, id);
        return cat.update({ name });
    }

    static async delete(tenantId, id) {
        const cat = await CategoryService.getById(tenantId, id);
        await cat.destroy();
        return { message: 'Category deleted' };
    }
}
