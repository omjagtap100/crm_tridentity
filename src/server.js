/**
 * Entry point: tracing → app → listen on PORT.
 * Keep this file thin; business routes live in app.js.
 */
import './instrumentation.js';
import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const startServer = async () => {
    const app = await createApp({
        connectDb: true,
        enableCron: true,
        enableSwagger: true,
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Health: http://localhost:${PORT}/health`);
        console.log(`Metrics: http://localhost:${PORT}/metrics`);
    });
};

startServer().catch((err) => {
    console.error('Fatal error during startup:', err);
    process.exit(1);
});
