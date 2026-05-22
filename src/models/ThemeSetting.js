export default (sequelize, DataTypes) => {
    const ThemeSetting = sequelize.define('ThemeSetting', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },

        // --- Brand Identity ---
        store_name: { type: DataTypes.STRING, allowNull: true },
        store_tagline: { type: DataTypes.STRING, allowNull: true },
        logo_url: { type: DataTypes.STRING, allowNull: true },
        favicon_url: { type: DataTypes.STRING, allowNull: true },

        // --- Global Theming ---
        primary_color: { type: DataTypes.STRING, allowNull: true },
        accent_color: { type: DataTypes.STRING, allowNull: true },
        background_style: { type: DataTypes.STRING, allowNull: true, defaultValue: 'light' },
        font_family: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Inter' },

        // --- Hero Section ---
        // JSON: { promo_badge, headline, sub_headline, hero_image_url }
        hero_config: { type: DataTypes.JSON, allowNull: true },

        // --- Layout & Navigation ---
        // JSON: { show_hero, show_trust_signals, show_featured_products }
        layout_config: { type: DataTypes.JSON, allowNull: true },

        // --- Hero legacy banner ---
        banner_url: { type: DataTypes.STRING, allowNull: true },

        // --- Footer & Social Integration ---
        // JSON: { facebook, instagram, twitter, youtube, linkedin }
        social_links: { type: DataTypes.JSON, allowNull: true },
        // JSON: { email, phone, address }
        contact_info: { type: DataTypes.JSON, allowNull: true },
        copyright_text: { type: DataTypes.STRING, allowNull: true },
    }, {
        tableName: 'theme_settings',
        timestamps: false,
    });

    ThemeSetting.associate = (models) => {
        ThemeSetting.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    };

    return ThemeSetting;
};
