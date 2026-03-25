import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';

export class UserService {

    static async getAll({ tenantId, role, page = 1, limit = 50 }) {
        const where = {};
        if (tenantId !== undefined) where.tenant_id = tenantId;
        if (role) where.role = role;

        const offset = (page - 1) * limit;
        const { count, rows } = await MODELS.User.findAndCountAll({
            where,
            attributes: { exclude: ['password_hash'] },
            limit: parseInt(limit),
            offset,
            order: [['id', 'DESC']],
        });
        return { total: count, page: parseInt(page), limit: parseInt(limit), users: rows };
    }

    static async getById(id) {
        const user = await MODELS.User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }
}
