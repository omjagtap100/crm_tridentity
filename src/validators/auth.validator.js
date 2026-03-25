import Joi from 'joi';

export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('customer', 'merchant').default('customer'),
    tenantId: Joi.number().integer().optional(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    tenantId: Joi.number().integer().optional(),
});

export const refreshSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((d) => d.message),
            });
        }
        req.body = value;
        next();
    };
};
