'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('theme_settings', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            tenant_id: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
            primary_color: { type: Sequelize.STRING, allowNull: true },
            logo_url: { type: Sequelize.STRING, allowNull: true },
            banner_url: { type: Sequelize.STRING, allowNull: true },
            layout_config: { type: Sequelize.JSON, allowNull: true },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('theme_settings');
    },
};
