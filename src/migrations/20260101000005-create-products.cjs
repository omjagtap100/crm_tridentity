'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('products', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.TEXT },
            price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
            stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            reserved_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            images: { type: Sequelize.JSON },
            visible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            slug: { type: Sequelize.STRING, allowNull: false },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
            deleted_at: { type: Sequelize.DATE },
        });
        await queryInterface.addIndex('products', ['slug', 'tenant_id'], { unique: true, name: 'products_slug_tenant_unique' });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('products');
    },
};
