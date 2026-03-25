import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 3000;
const host = process.env.DB_HOST === 'localhost' || !process.env.DB_HOST ? `http://localhost:${port}` : `https://api.yourdomain.com`;

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'eCommerce SaaS Backend API',
            version: '1.0.0',
            description: 'API documentation for the multi-tenant eCommerce SaaS platform',
        },
        servers: [
            {
                url: host,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/**/*.js'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
    }));

    // Serve Swagger JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`[Swagger] API docs available at ${host}/api-docs`);
    console.log(`[Swagger] API JSON available at ${host}/api-docs.json`);
};
