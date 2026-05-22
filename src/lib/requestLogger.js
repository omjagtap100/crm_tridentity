import morgan from 'morgan';

/** JSON logs for Filebeat/ELK; default combined format for local dev. */
export function createRequestLogger() {
    if (process.env.NODE_ENV === 'test') {
        return morgan('tiny');
    }
    if (process.env.LOG_FORMAT === 'json') {
        return morgan((tokens, req, res) =>
            JSON.stringify({
                service: process.env.OTEL_SERVICE_NAME || 'ecom-saas-backend',
                method: tokens.method(req, res),
                url: tokens.url(req, res),
                status: Number(tokens.status(req, res)),
                responseTimeMs: Number(tokens['response-time'](req, res)),
                contentLength: tokens.res(req, res, 'content-length'),
            })
        );
    }
    return morgan('combined');
}
