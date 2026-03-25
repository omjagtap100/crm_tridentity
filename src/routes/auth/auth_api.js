import express from 'express';
import { AuthService } from '../../entityManagers/auth/AuthService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { ApiError } from '../../helper/ApiError.js';
import { validate, registerSchema, loginSchema, refreshSchema } from '../../validators/auth.validator.js';

export const auth_api = express.Router();

const ns = '/api/v1/auth';

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, merchant]
 *               tenantId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Registration successful
 */
// POST /api/v1/auth/register
auth_api.post(`${ns}/register`, validate(registerSchema), async (req, res, next) => {
    try {
        const { email, password, role, tenantId } = req.body;
        const result = await AuthService.register({ email, password, role, tenantId });
        res.status(201).json(new ApiResponse(201, result, 'Registration successful'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/auth/customer/login:
 *   post:
 *     summary: Login customer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               tenantId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Login successful
 */
// POST /api/v1/auth/customer/login
auth_api.post(`${ns}/customer/login`, validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password, tenantId } = req.body;
        const result = await AuthService.loginCustomer({ email, password, tenantId });
        res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/auth/merchant/login:
 *   post:
 *     summary: Login merchant
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               tenantId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Login successful
 */
// POST /api/v1/auth/merchant/login
auth_api.post(`${ns}/merchant/login`, validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password, tenantId } = req.body;
        const result = await AuthService.loginMerchant({ email, password, tenantId });
        res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/auth/admin/login:
 *   post:
 *     summary: Login admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
// POST /api/v1/auth/admin/login
auth_api.post(`${ns}/admin/login`, validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.loginAdmin({ email, password });
        res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 */
// POST /api/v1/auth/refresh
auth_api.post(`${ns}/refresh`, validate(refreshSchema), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await AuthService.refresh({ refreshToken });
        res.status(200).json(new ApiResponse(200, result, 'Token refreshed'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 */
// POST /api/v1/auth/logout
auth_api.post(`${ns}/logout`, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new ApiError(400, 'Refresh token required');
        const result = await AuthService.logout({ refreshToken });
        res.status(200).json(new ApiResponse(200, result, 'Logged out'));
    } catch (error) {
        next(error);
    }
});
