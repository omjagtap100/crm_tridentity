'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    up: async (queryInterface) => {
        const password_hash = await bcrypt.hash('Admin@123', 12);
        await queryInterface.bulkInsert('users', [{
            tenant_id: null,
            email: 'admin@ecom-saas.com',
            password_hash,
            role: 'super_admin',
            created_at: new Date(),
        }]);
    },
    down: async (queryInterface) => {
        await queryInterface.bulkDelete('users', { email: 'admin@ecom-saas.com' });
    },
};
