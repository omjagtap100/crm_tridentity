'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Brand Identity
        await queryInterface.addColumn('theme_settings', 'store_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('theme_settings', 'store_tagline', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('theme_settings', 'favicon_url', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        // Global Theming
        await queryInterface.addColumn('theme_settings', 'accent_color', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('theme_settings', 'background_style', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'light',
        });
        await queryInterface.addColumn('theme_settings', 'font_family', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'Inter',
        });

        // Hero Section
        await queryInterface.addColumn('theme_settings', 'hero_config', {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'JSON: { promo_badge, headline, sub_headline, hero_image_url }',
        });

        // Footer & Social
        await queryInterface.addColumn('theme_settings', 'social_links', {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'JSON: { facebook, instagram, twitter, youtube, linkedin }',
        });
        await queryInterface.addColumn('theme_settings', 'contact_info', {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'JSON: { email, phone, address }',
        });
        await queryInterface.addColumn('theme_settings', 'copyright_text', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('theme_settings', 'store_name');
        await queryInterface.removeColumn('theme_settings', 'store_tagline');
        await queryInterface.removeColumn('theme_settings', 'favicon_url');
        await queryInterface.removeColumn('theme_settings', 'accent_color');
        await queryInterface.removeColumn('theme_settings', 'background_style');
        await queryInterface.removeColumn('theme_settings', 'font_family');
        await queryInterface.removeColumn('theme_settings', 'hero_config');
        await queryInterface.removeColumn('theme_settings', 'social_links');
        await queryInterface.removeColumn('theme_settings', 'contact_info');
        await queryInterface.removeColumn('theme_settings', 'copyright_text');
    },
};
