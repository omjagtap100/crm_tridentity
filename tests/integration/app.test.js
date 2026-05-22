/**
 * INTEGRATION test — real HTTP via supertest against Express app.
 * connectDb:false so CI/Jenkins does not need MySQL for basic pipeline gates.
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Express app integration', () => {
    let app;

    beforeAll(async () => {
        app = await createApp({
            connectDb: false,
            enableCron: false,
            enableSwagger: false,
        });
    });

    describe('GET /health', () => {
        it('returns 200 and JSON health body', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Server is running');
            expect(res.body.timestamp).toBeDefined();
        });
    });

    describe('GET /metrics', () => {
        it('returns Prometheus text format', async () => {
            const res = await request(app).get('/metrics');

            expect(res.status).toBe(200);
            expect(res.text).toContain('ecom_');
        });
    });

    describe('GET /unknown-route', () => {
        it('returns 404 for missing routes', async () => {
            const res = await request(app).get('/this-route-does-not-exist');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});
