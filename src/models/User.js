export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: false },
        password_hash: { type: DataTypes.STRING, allowNull: false },
        role: {
            type: DataTypes.ENUM('super_admin', 'merchant', 'customer'),
            allowNull: false,
        },
    }, {
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        indexes: [
            { unique: true, fields: ['email', 'tenant_id'] },
        ],
    });

    User.associate = (models) => {
        User.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
        User.hasMany(models.JwtToken, { foreignKey: 'user_id', as: 'jwtTokens' });
        User.hasMany(models.Cart, { foreignKey: 'user_id', as: 'carts' });
        User.hasMany(models.AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
    };

    return User;
};
