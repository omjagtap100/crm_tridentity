/**
 * OpenTelemetry → Jaeger (distributed tracing for Monitoring stage).
 * Loaded first from server.js so Express/MySQL calls are traced automatically.
 *
 * Skipped when NODE_ENV=test (Jest) or OTEL_ENABLED=false.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const isTest = process.env.NODE_ENV === 'test';
const otelOff = process.env.OTEL_ENABLED === 'false';

if (!isTest && !otelOff) {
    const endpoint =
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

    const sdk = new NodeSDK({
        serviceName: process.env.OTEL_SERVICE_NAME || 'ecom-saas-backend',
        traceExporter: new OTLPTraceExporter({ url: endpoint }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
            }),
        ],
    });

    sdk.start();
    console.log(`OpenTelemetry tracing enabled → ${endpoint}`);
}
