'use strict';

require('dotenv').config();

const isAzureMysql = (host) =>
    typeof host === 'string' && host.includes('.mysql.database.azure.com');

const base = (env) => {
    const host = process.env.DB_HOST || '127.0.0.1';
    const cfg = {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || 'ecom_saas_db',
        host,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        dialect: 'mysql',
    };

    if (isAzureMysql(host)) {
        cfg.dialectOptions = {
            ssl: { require: true, minVersion: 'TLSv1.2' },
        };
    }

    return cfg;
};

module.exports = {
    development: base('development'),
    staging: base('staging'),
    production: base('production'),
};
