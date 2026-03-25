import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';
import { v4 as uuidv4 } from 'uuid';

export class CartService {

    static async getOrCreate(tenantId, userId, guestId) {
        const { Cart } = MODELS;

        const where = { tenant_id: tenantId };
        if (userId) {
            where.user_id = userId;
        } else {
            where.guest_id = guestId;
        }

        let cart = await Cart.findOne({ where, include: [{ model: MODELS.CartItem, as: 'items', include: [{ model: MODELS.Product, as: 'product' }] }] });

        if (!cart) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            cart = await Cart.create({ tenant_id: tenantId, user_id: userId || null, guest_id: guestId || uuidv4(), expires_at: expiresAt });
            cart = await Cart.findByPk(cart.id, { include: [{ model: MODELS.CartItem, as: 'items', include: [{ model: MODELS.Product, as: 'product' }] }] });
        }

        return cart;
    }

    static async addItem(tenantId, userId, guestId, { productId, quantity }) {
        const { CartItem } = MODELS;

        const product = await MODELS.Product.findOne({ where: { id: productId, tenant_id: tenantId, visible: true } });
        if (!product) throw new ApiError(404, 'Product not found');
        if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

        const cart = await CartService.getOrCreate(tenantId, userId, guestId);

        const existingItem = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });

        if (existingItem) {
            await existingItem.update({ quantity: existingItem.quantity + quantity });
        } else {
            await CartItem.create({ cart_id: cart.id, product_id: productId, quantity });
        }

        return CartService.getCart(tenantId, userId, guestId);
    }

    static async getCart(tenantId, userId, guestId) {
        return CartService.getOrCreate(tenantId, userId, guestId);
    }

    static async syncCart(tenantId, userId, guestId, items) {
        // Sync guest cart to user cart on login
        const { Cart, CartItem } = MODELS;

        const guestCart = await Cart.findOne({ where: { tenant_id: tenantId, guest_id: guestId } });
        if (!guestCart) return CartService.getCart(tenantId, userId, null);

        const userCart = await CartService.getOrCreate(tenantId, userId, null);

        const guestItems = await CartItem.findAll({ where: { cart_id: guestCart.id } });
        for (const guestItem of guestItems) {
            const existing = await CartItem.findOne({ where: { cart_id: userCart.id, product_id: guestItem.product_id } });
            if (existing) {
                await existing.update({ quantity: existing.quantity + guestItem.quantity });
            } else {
                await CartItem.create({ cart_id: userCart.id, product_id: guestItem.product_id, quantity: guestItem.quantity });
            }
        }

        await guestCart.destroy();
        return CartService.getCart(tenantId, userId, null);
    }

    static async removeItem(tenantId, userId, guestId, cartItemId) {
        const { CartItem } = MODELS;
        const cart = await CartService.getOrCreate(tenantId, userId, guestId);
        const item = await CartItem.findOne({ where: { id: cartItemId, cart_id: cart.id } });
        if (!item) throw new ApiError(404, 'Cart item not found');
        await item.destroy();
        return { message: 'Item removed' };
    }
}
