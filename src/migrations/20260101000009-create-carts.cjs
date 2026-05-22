'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('carts', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
            guest_id: { type: Sequelize.STRING, allowNull: true },
            tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
            expires_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('carts');
    },
};
