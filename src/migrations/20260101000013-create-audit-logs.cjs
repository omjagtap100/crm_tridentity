'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('audit_logs', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
            tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' }, onDelete: 'SET NULL' },
            action: { type: Sequelize.STRING, allowNull: false },
            entity: { type: Sequelize.STRING, allowNull: true },
            entity_id: { type: Sequelize.INTEGER, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('audit_logs');
    },
};
