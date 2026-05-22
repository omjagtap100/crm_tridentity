import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isAzureMysql = (host) =>
    typeof host === 'string' && host.includes('.mysql.database.azure.com');

/** Shared DB settings for app runtime (must match config.cjs SSL rules for Azure). */
const buildDbConfig = () => {
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

const dbBase = buildDbConfig();

const config = {
    development: { ...dbBase },
    staging: { ...dbBase },
    production: { ...dbBase },
};

export const bucket = {
    TENCENT_BUCKET: process.env.TENCENT_BUCKET,
    TENCENT_BUCKET_REGION: process.env.TENCENT_BUCKET_REGION,
    TENCENT_SECRET_ID: process.env.TENCENT_SECRET_ID,
    TENCENT_SECRET_KEY: process.env.TENCENT_SECRET_KEY,
};

const envConfig = { ...config, bucket };

export default envConfig;
