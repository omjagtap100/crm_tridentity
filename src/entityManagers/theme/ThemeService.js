import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';

export class ThemeService {

    static async getTheme(tenantId) {
        let theme = await MODELS.ThemeSetting.findOne({ where: { tenant_id: tenantId } });
        if (!theme) {
            // Return defaults if not configured
            return { tenant_id: tenantId, primary_color: '#3B82F6', logo_url: null, banner_url: null, layout_config: {} };
        }
        return theme;
    }

    static async upsertTheme(tenantId, { primary_color, logo_url, banner_url, layout_config }) {
        const existing = await MODELS.ThemeSetting.findOne({ where: { tenant_id: tenantId } });

        if (existing) {
            return existing.update({ primary_color, logo_url, banner_url, layout_config });
        }

        return MODELS.ThemeSetting.create({ tenant_id: tenantId, primary_color, logo_url, banner_url, layout_config });
    }
}
