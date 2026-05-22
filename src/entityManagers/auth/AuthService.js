import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';
import { hashPassword, comparePassword } from '../../helper/PasswordHelper.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../helper/JwtHelper.js';

export class AuthService {

    static async register({ email, password, role = 'customer', tenantId = null }) {
        const { User } = MODELS;

        const existing = await User.findOne({
            where: { email, tenant_id: tenantId },
        });
        if (existing) {
            throw new ApiError(409, 'Email already registered for this tenant');
        }

        const password_hash = await hashPassword(password);
        const user = await User.create({ email, password_hash, role, tenant_id: tenantId });

        const payload = { userId: user.id, tenantId: user.tenant_id, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await AuthService._storeRefreshToken(user.id, refreshToken);

        return { user: AuthService._sanitize(user), accessToken, refreshToken };
    }

    static async loginCustomer({ email, password, tenantId }) {
        return AuthService._login({ email, password, tenantId, role: 'customer' });
    }

    static async loginMerchant({ email, password, tenantId }) {
        return AuthService._login({ email, password, tenantId, role: 'merchant' });
    }

    static async loginAdmin({ email, password }) {
        return AuthService._login({ email, password, tenantId: null, role: 'super_admin' });
    }

    static async _login({ email, password, tenantId, role }) {
        const { User } = MODELS;

        const where = { email, role };
        if (tenantId !== undefined) where.tenant_id = tenantId;

        const user = await User.findOne({ where });
        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const payload = { userId: user.id, tenantId: user.tenant_id, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await AuthService._storeRefreshToken(user.id, refreshToken);

        return { user: AuthService._sanitize(user), accessToken, refreshToken };
    }

    static async refresh({ refreshToken }) {
        const { JwtToken, User } = MODELS;

        let claims;
        try {
            claims = verifyRefreshToken(refreshToken);
        } catch {
            throw new ApiError(401, 'Invalid or expired refresh token');
        }

        const tokenRecord = await JwtToken.findOne({
            where: { token: refreshToken, type: 'refresh', user_id: claims.userId },
        });
        if (!tokenRecord || new Date() > tokenRecord.expires_at) {
            throw new ApiError(401, 'Refresh token not found or expired');
        }

        const user = await User.findByPk(claims.userId);
        if (!user) throw new ApiError(404, 'User not found');

        const payload = { userId: user.id, tenantId: user.tenant_id, role: user.role };
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        // Rotate refresh token
        await tokenRecord.destroy();
        await AuthService._storeRefreshToken(user.id, newRefreshToken);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    static async logout({ refreshToken }) {
        const { JwtToken } = MODELS;
        await JwtToken.destroy({ where: { token: refreshToken, type: 'refresh' } });
        return { message: 'Logged out successfully' };
    }

    static async _storeRefreshToken(userId, token) {
        const { JwtToken } = MODELS;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await JwtToken.create({ user_id: userId, token, type: 'refresh', expires_at: expiresAt });
    }

    static _sanitize(user) {
        const plain = user.get({ plain: true });
        delete plain.password_hash;
        return plain;
    }
}
