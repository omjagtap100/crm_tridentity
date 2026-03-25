'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    up: async (queryInterface) => {
        // Create sample tenant
        await queryInterface.bulkInsert('tenants', [{
            name: 'Sample Store',
            active: true,
            created_at: new Date(),
        }]);

        // Get tenant id
        const [tenants] = await queryInterface.sequelize.query(
            `SELECT id FROM tenants WHERE name = 'Sample Store' LIMIT 1`
        );
        const tenantId = tenants[0]?.id;
        if (!tenantId) return;

        // Create primary domain for tenant
        await queryInterface.bulkInsert('domains', [{
            tenant_id: tenantId,
            domain: 'store1',
            is_primary: true,
        }]);

        // Create merchant user for this tenant
        const password_hash = await bcrypt.hash('Merchant@123', 12);
        await queryInterface.bulkInsert('users', [{
            tenant_id: tenantId,
            email: 'merchant@store1.com',
            password_hash,
            role: 'merchant',
            created_at: new Date(),
        }]);

        // Create theme for tenant
        await queryInterface.bulkInsert('theme_settings', [{
            tenant_id: tenantId,
            primary_color: '#3B82F6',
            logo_url: null,
            banner_url: null,
            layout_config: JSON.stringify({ hero: true }),
        }]);
    },
    down: async (queryInterface) => {
        await queryInterface.bulkDelete('users', { email: 'merchant@store1.com' });
        await queryInterface.bulkDelete('tenants', { name: 'Sample Store' });
    },
};
