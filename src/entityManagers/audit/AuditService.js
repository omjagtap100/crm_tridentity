import { MODELS } from '../../sequelize.js';

export class AuditService {

    static async log({ userId = null, tenantId = null, action, entity = null, entityId = null }) {
        return MODELS.AuditLog.create({ user_id: userId, tenant_id: tenantId, action, entity, entity_id: entityId });
    }

    static async getLogs({ tenantId, page = 1, limit = 50 }) {
        const offset = (page - 1) * limit;
        const { count, rows } = await MODELS.AuditLog.findAndCountAll({
            where: { tenant_id: tenantId },
            include: [{ model: MODELS.User, as: 'user', attributes: ['id', 'email', 'role'] }],
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
        });
        return { total: count, page: parseInt(page), limit: parseInt(limit), logs: rows };
    }
}
