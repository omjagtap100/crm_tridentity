/** Jest config for ESM ("type": "module" in package.json). */
export default {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/migrations/**',
        '!src/seeders/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'coverage',
                outputName: 'junit.xml',
            },
        ],
    ],
    testTimeout: 30000,
};
