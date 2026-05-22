'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('product_variants', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING, allowNull: false },
            price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
            stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('product_variants');
    },
};
