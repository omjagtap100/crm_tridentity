/**
 * Pure health-check payload (no Express, no database).
 * Unit tests target this function so Jenkins "Test" stage can run without MySQL.
 */
export function buildHealthPayload() {
    return {
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    };
}
