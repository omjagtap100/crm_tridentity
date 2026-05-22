import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';

export class ThemeService {

    /**
     * Returns the raw ThemeSetting DB record for a tenant.
     * Falls back to sensible defaults if not yet configured.
     */
    static async getTheme(tenantId) {
        const theme = await MODELS.ThemeSetting.findOne({ where: { tenant_id: tenantId } });
        if (!theme) {
            return {
                tenant_id: tenantId,
                store_name: null,
                store_tagline: null,
                logo_url: null,
                favicon_url: null,
                primary_color: '#3B82F6',
                accent_color: '#F59E0B',
                background_style: 'light',
                font_family: 'Inter',
                hero_config: {},
                layout_config: { show_hero: true, show_trust_signals: true, show_featured_products: true },
                banner_url: null,
                social_links: {},
                contact_info: {},
                copyright_text: null,
            };
        }
        return theme;
    }

    /**
     * Looks up a domain string in the domains table → resolves tenantId → fetches theme.
     * Returns a fully structured UI config response.
     */
    static async getThemeByDomain(domain) {
        if (!domain) {
            throw new ApiError(400, 'domain query parameter is required');
        }

        const domainRecord = await MODELS.Domain.findOne({ where: { domain } });
        if (!domainRecord) {
            throw new ApiError(404, `Domain '${domain}' not found`);
        }

        const tenant = await MODELS.Tenant.findByPk(domainRecord.tenant_id);
        if (!tenant) {
            throw new ApiError(404, 'Tenant not found');
        }
        if (!tenant.active) {
            throw new ApiError(403, 'Tenant is inactive');
        }

        const theme = await ThemeService.getTheme(domainRecord.tenant_id);
        return ThemeService.toStructuredResponse(domainRecord.tenant_id, domain, theme);
    }

    /**
     * Upsert. Accepts the full set of UI customization fields.
     */
    static async upsertTheme(tenantId, {
        store_name, store_tagline, logo_url, favicon_url,
        primary_color, accent_color, background_style, font_family,
        hero_config, layout_config, banner_url,
        social_links, contact_info, copyright_text,
    }) {
        const fields = {
            store_name, store_tagline, logo_url, favicon_url,
            primary_color, accent_color, background_style, font_family,
            hero_config, layout_config, banner_url,
            social_links, contact_info, copyright_text,
        };

        const existing = await MODELS.ThemeSetting.findOne({ where: { tenant_id: tenantId } });

        if (existing) {
            return existing.update(fields);
        }

        return MODELS.ThemeSetting.create({ tenant_id: tenantId, ...fields });
    }

    /**
     * Converts a flat DB record (or defaults object) into the structured
     * UI config JSON that the frontend expects.
     */
    static toStructuredResponse(tenantId, domain, theme) {
        return {
            domain: domain ?? null,
            tenant_id: tenantId,
            brand: {
                store_name: theme.store_name ?? null,
                store_tagline: theme.store_tagline ?? null,
                logo_url: theme.logo_url ?? null,
                favicon_url: theme.favicon_url ?? null,
            },
            theme: {
                primary_color: theme.primary_color ?? '#3B82F6',
                accent_color: theme.accent_color ?? '#F59E0B',
                background_style: theme.background_style ?? 'light',
                font_family: theme.font_family ?? 'Inter',
            },
            hero: {
                promo_badge: theme.hero_config?.promo_badge ?? null,
                headline: theme.hero_config?.headline ?? null,
                sub_headline: theme.hero_config?.sub_headline ?? null,
                hero_image_url: theme.hero_config?.hero_image_url ?? theme.banner_url ?? null,
            },
            layout: {
                show_hero: theme.layout_config?.show_hero ?? true,
                show_trust_signals: theme.layout_config?.show_trust_signals ?? true,
                show_featured_products: theme.layout_config?.show_featured_products ?? true,
            },
            footer: {
                social_links: {
                    facebook: theme.social_links?.facebook ?? null,
                    instagram: theme.social_links?.instagram ?? null,
                    twitter: theme.social_links?.twitter ?? null,
                    youtube: theme.social_links?.youtube ?? null,
                    linkedin: theme.social_links?.linkedin ?? null,
                },
                contact_info: {
                    email: theme.contact_info?.email ?? null,
                    phone: theme.contact_info?.phone ?? null,
                    address: theme.contact_info?.address ?? null,
                },
                copyright: theme.copyright_text ?? null,
            },
        };
    }
}
