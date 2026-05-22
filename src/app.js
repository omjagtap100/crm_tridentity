/**
 * Application factory — Express app WITHOUT starting HTTP server.
 *
 * Why separate from server.js?
 * - Tests use supertest against `app` only (no port, no MySQL required).
 * - Jenkins Test stage stays fast and reliable.
 * - Same route setup runs in dev, Docker, and CI.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRequestLogger } from './lib/requestLogger.js';
import rateLimit from 'express-rate-limit';
import { startConnection } from './sequelize.js';
import { auth_api } from './routes/auth/auth_api.js';
import { storeApis } from './routes/store/store_api.js';
import { crmApis } from './routes/crm/crm_api.js';
import { adminApis } from './routes/admin/admin_api.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { startTokenCleanup } from './cron/tokenCleanup.js';
import { startCartCleanup } from './cron/cartCleanup.js';
import { setupSwagger } from './config/swagger.js';
import { buildHealthPayload } from './lib/health.js';
import { metricsMiddleware, getMetricsText, getMetricsContentType } from './metrics.js';

/**
 * @param {object} options
 * @param {boolean} [options.connectDb=true] - Connect MySQL via Sequelize (false in tests)
 * @param {boolean} [options.enableCron=true] - Background token/cart cleanup jobs
 * @param {boolean} [options.enableSwagger=true] - Swagger UI at /api-docs
 */
export async function createApp(options = {}) {
    const {
        connectDb = true,
        enableCron = true,
        enableSwagger = true,
    } = options;

    if (connectDb) {
        await startConnection();
    }

    const app = express();

    app.use(helmet());
    app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
    app.use(createRequestLogger());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: false }));

    app.use(metricsMiddleware);

    if (enableSwagger) {
        setupSwagger(app);
    }

    app.use('/uploads', express.static('uploads'));

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: { success: false, message: 'Too many requests, please try again later' },
    });
    app.use('/api/v1/auth', authLimiter);

    app.get('/health', (req, res) => {
        res.status(200).json(buildHealthPayload());
    });

    app.get('/metrics', async (req, res) => {
        res.set('Content-Type', getMetricsContentType());
        res.end(await getMetricsText());
    });

    app.use(auth_api);
    storeApis.forEach((r) => app.use(r));
    crmApis.forEach((r) => app.use(r));
    adminApis.forEach((r) => app.use(r));

    app.use((req, res) => {
        res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
    });

    app.use(errorMiddleware);

    if (enableCron) {
        startTokenCleanup();
        startCartCleanup();
    }

    return app;
}
