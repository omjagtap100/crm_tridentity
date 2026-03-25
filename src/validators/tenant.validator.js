import Joi from 'joi';
import { validate } from './auth.validator.js';

const tenantSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
});

const domainSchema = Joi.object({
    domain: Joi.string().required(),
    is_primary: Joi.boolean().default(false),
});

export const validateTenant = validate(tenantSchema);
export const validateDomain = validate(domainSchema);
