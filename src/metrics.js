/**
 * Prometheus metrics (Monitoring stage — Stage 7).
 * prom-client exposes counters/histograms Jenkins & Grafana can scrape at GET /metrics.
 */
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({
    register,
    prefix: 'ecom_',
});

export const httpRequestDuration = new client.Histogram({
    name: 'ecom_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
});

register.registerMetric(httpRequestDuration);

/** Middleware: record how long each request takes (for Grafana dashboards). */
export function metricsMiddleware(req, res, next) {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        const route = req.route?.path || req.path || 'unknown';
        end({
            method: req.method,
            route,
            status_code: res.statusCode,
        });
    });
    next();
}

export async function getMetricsText() {
    return register.metrics();
}

export function getMetricsContentType() {
    return register.contentType;
}
