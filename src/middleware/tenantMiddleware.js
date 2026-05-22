import { MODELS } from '../sequelize.js';
import { ApiError } from '../helper/ApiError.js';

/**
 * Resolves tenantId from:
 *  1. req.user.tenantId (JWT — for CRM/Admin routes)
 *  2. subdomain header / query param (for Storefront routes)
 * Attaches req.tenantId
 */
export const tenantMiddleware = async (req, res, next) => {
    try {
        let tenantId = null;

        // From JWT (authenticated routes)
        if (req.user && req.user.tenantId) {
            tenantId = req.user.tenantId;
        } else {
            // From subdomain (storefront)
            tenantId = await getTenantFromDomain(req);
        }

        if (!tenantId) {
            throw new ApiError(400, 'Unable to resolve tenant');
        }

        const tenant = await MODELS.Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new ApiError(404, 'Tenant not found');
        }
        if (!tenant.active) {
            throw new ApiError(403, 'Tenant is inactive');
        }

        req.tenantId = tenantId;
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error);
        }
        return res.status(500).json(new ApiError(500, 'Tenant resolution failed'));
    }
};

export const getTenantFromDomain = async (req) => {
    // Try X-Tenant-ID header first (useful for testing)
    const headerTenantId = req.headers['x-tenant-id'];
    if (headerTenantId) return parseInt(headerTenantId);

    // Try subdomain resolution
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (!subdomain) return null;

    const domain = await MODELS.Domain.findOne({ where: { domain: subdomain } });
    return domain ? domain.tenant_id : null;
};
