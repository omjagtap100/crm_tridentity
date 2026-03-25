'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('domains', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
            domain: { type: Sequelize.STRING, allowNull: false, unique: true },
            is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('domains');
    },
};
