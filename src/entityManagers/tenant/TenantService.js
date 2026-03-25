import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';

export class TenantService {

    static async getAll() {
        return MODELS.Tenant.findAll({ include: [{ model: MODELS.Domain, as: 'domains' }] });
    }

    static async getById(id) {
        const tenant = await MODELS.Tenant.findByPk(id, {
            include: [{ model: MODELS.Domain, as: 'domains' }],
        });
        if (!tenant) throw new ApiError(404, 'Tenant not found');
        return tenant;
    }

    static async create({ name }) {
        return MODELS.Tenant.create({ name, active: true });
    }

    static async update(id, { name }) {
        const tenant = await TenantService.getById(id);
        return tenant.update({ name });
    }

    static async setStatus(id, active) {
        const tenant = await TenantService.getById(id);
        return tenant.update({ active });
    }

    static async delete(id) {
        const tenant = await TenantService.getById(id);
        await tenant.destroy();
        return { message: 'Tenant deleted' };
    }

    static async addDomain(tenantId, { domain, is_primary = false }) {
        const { Domain } = MODELS;
        const existing = await Domain.findOne({ where: { domain } });
        if (existing) throw new ApiError(409, 'Domain already in use');
        return Domain.create({ tenant_id: tenantId, domain, is_primary });
    }
}
