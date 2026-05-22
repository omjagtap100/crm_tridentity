import Joi from 'joi';
import { validate } from './auth.validator.js';

const productSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().optional().allow('', null),
    price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required(),
    images: Joi.array().items(Joi.string()).optional(),
    visible: Joi.boolean().default(true),
    slug: Joi.string().regex(/^[a-z0-9-]+$/).required().messages({
        'string.pattern.base': 'Slug must be lowercase letters, numbers, and hyphens only',
    }),
    categoryIds: Joi.array().items(Joi.number().integer()).optional(),
});

const productUpdateSchema = productSchema.fork(
    ['name', 'price', 'stock', 'slug'],
    (field) => field.optional()
);

export const validateProduct = validate(productSchema);
export const validateProductUpdate = validate(productUpdateSchema);
