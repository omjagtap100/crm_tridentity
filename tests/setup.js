/**
 * Runs before every test file.
 * NODE_ENV=test disables OpenTelemetry and keeps tests isolated from production config.
 */
process.env.NODE_ENV = 'test';
process.env.OTEL_ENABLED = 'false';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_minimum_64_characters_long_for_jwt_signing_ok';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_64_characters_long_for_jwt_signing_ok';
