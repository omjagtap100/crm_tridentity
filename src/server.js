import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { startConnection } from './sequelize.js';
import { auth_api } from './routes/auth/auth_api.js';
import { storeApis } from './routes/store/store_api.js';
import { crmApis } from './routes/crm/crm_api.js';
import { adminApis } from './routes/admin/admin_api.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { startTokenCleanup } from './cron/tokenCleanup.js';
import { startCartCleanup } from './cron/cartCleanup.js';
import { setupSwagger } from './config/swagger.js';

dotenv.config();

const app = express();

const init = async () => {
    // Connect DB
    await startConnection();

    // Security middleware
    app.use(helmet());
    app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

    // Request logging
    app.use(morgan('combined'));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: false }));

    // Setup Swagger UI
    setupSwagger(app);

    // Serve uploaded files statically
    app.use('/uploads', express.static('uploads'));

    // Rate limiting on auth routes
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 30,
        message: { success: false, message: 'Too many requests, please try again later' },
    });
    app.use('/api/v1/auth', authLimiter);

    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
    });

    // Routes
    app.use(auth_api);
    storeApis.forEach((r) => app.use(r));
    crmApis.forEach((r) => app.use(r));
    adminApis.forEach((r) => app.use(r));

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
    });

    // Centralized error handler
    app.use(errorMiddleware);

    // Background tasks
    startTokenCleanup();
    startCartCleanup();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

init().catch((err) => {
    console.error('Fatal error during startup:', err);
    process.exit(1);
});
