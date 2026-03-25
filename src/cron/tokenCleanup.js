import cron from 'node-cron';
import { MODELS } from '../sequelize.js';
import { Op } from 'sequelize';

export const startTokenCleanup = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const deleted = await MODELS.JwtToken.destroy({
                where: { expires_at: { [Op.lt]: new Date() } },
            });
            console.log(`[TokenCleanup] Deleted ${deleted} expired token(s)`);
        } catch (error) {
            console.error('[TokenCleanup] Error:', error.message);
        }
    });

    console.log('[TokenCleanup] Cron scheduled — runs every hour');
};
