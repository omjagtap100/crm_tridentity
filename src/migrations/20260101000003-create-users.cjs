'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('users', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' }, onDelete: 'SET NULL' },
            email: { type: Sequelize.STRING, allowNull: false },
            password_hash: { type: Sequelize.STRING, allowNull: false },
            role: { type: Sequelize.ENUM('super_admin', 'merchant', 'customer'), allowNull: false },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
            deleted_at: { type: Sequelize.DATE },
        });
        await queryInterface.addIndex('users', ['email', 'tenant_id'], { unique: true, name: 'users_email_tenant_unique' });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('users');
    },
};
