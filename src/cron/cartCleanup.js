import cron from 'node-cron';
import { MODELS } from '../sequelize.js';
import { Op } from 'sequelize';

export const startCartCleanup = () => {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        try {
            const expiredCarts = await MODELS.Cart.findAll({
                where: { expires_at: { [Op.lt]: new Date() } },
            });

            for (const cart of expiredCarts) {
                await MODELS.CartItem.destroy({ where: { cart_id: cart.id } });
                await cart.destroy();
            }

            console.log(`[CartCleanup] Cleaned ${expiredCarts.length} expired cart(s)`);
        } catch (error) {
            console.error('[CartCleanup] Error:', error.message);
        }
    });

    console.log('[CartCleanup] Cron scheduled — runs every 6 hours');
};
