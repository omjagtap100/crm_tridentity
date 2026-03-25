import express from 'express';
import { CartService } from '../../entityManagers/cart/CartService.js';
import { ApiResponse } from '../../helper/ApiResponse.js';
import { optionalAuthMiddleware } from '../../middleware/authMiddleware.js';
import { tenantMiddleware } from '../../middleware/tenantMiddleware.js';

export const store_cart_api = express.Router();

const ns = '/api/v1/store/cart';

/**
 * @swagger
 * /api/v1/store/cart:
 *   get:
 *     summary: Get cart for guest or logged in user
 *     tags: [Storefront]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *         description: Optional guest session ID
 *     responses:
 *       200:
 *         description: Cart fetched
 */
// GET /api/v1/store/cart
store_cart_api.get(ns, optionalAuthMiddleware, tenantMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.userId || null;
        const guestId = req.headers['x-guest-id'] || null;
        const cart = await CartService.getCart(req.tenantId, userId, guestId);
        res.status(200).json(new ApiResponse(200, cart, 'Cart fetched'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/store/cart:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Storefront]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 */
// POST /api/v1/store/cart
store_cart_api.post(ns, optionalAuthMiddleware, tenantMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.userId || null;
        const guestId = req.headers['x-guest-id'] || null;
        const { productId, quantity = 1 } = req.body;
        const cart = await CartService.addItem(req.tenantId, userId, guestId, { productId, quantity });
        res.status(200).json(new ApiResponse(200, cart, 'Item added to cart'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/store/cart/sync:
 *   post:
 *     summary: Sync guest cart to user cart
 *     tags: [Storefront]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart synced
 */
// POST /api/v1/store/cart/sync
store_cart_api.post(`${ns}/sync`, optionalAuthMiddleware, tenantMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.userId || null;
        const guestId = req.headers['x-guest-id'] || null;
        const cart = await CartService.syncCart(req.tenantId, userId, guestId, []);
        res.status(200).json(new ApiResponse(200, cart, 'Cart synced'));
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/store/cart/{itemId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Storefront]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 */
// DELETE /api/v1/store/cart/:itemId
store_cart_api.delete(`${ns}/:itemId`, optionalAuthMiddleware, tenantMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.userId || null;
        const guestId = req.headers['x-guest-id'] || null;
        const result = await CartService.removeItem(req.tenantId, userId, guestId, parseInt(req.params.itemId));
        res.status(200).json(new ApiResponse(200, result, 'Item removed'));
    } catch (error) {
        next(error);
    }
});
