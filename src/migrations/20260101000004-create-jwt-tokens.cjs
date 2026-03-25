'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('jwt_tokens', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
            token: { type: Sequelize.TEXT, allowNull: false },
            type: { type: Sequelize.ENUM('refresh', 'reset'), allowNull: false },
            expires_at: { type: Sequelize.DATE, allowNull: false },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('jwt_tokens');
    },
};
