/**
 * UNIT test — tests one function in isolation (no HTTP server, no database).
 * Jenkins publishes these results; fast feedback on broken health logic.
 */
import { buildHealthPayload } from '../../src/lib/health.js';

describe('buildHealthPayload', () => {
    it('returns success true and a message', () => {
        const payload = buildHealthPayload();

        expect(payload.success).toBe(true);
        expect(payload.message).toBe('Server is running');
    });

    it('includes an ISO timestamp string', () => {
        const payload = buildHealthPayload();

        expect(payload.timestamp).toBeDefined();
        expect(() => new Date(payload.timestamp).toISOString()).not.toThrow();
    });
});
