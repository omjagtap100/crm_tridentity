export default (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        guest_id: { type: DataTypes.STRING, allowNull: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'carts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });

    Cart.associate = (models) => {
        Cart.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Cart.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
        Cart.hasMany(models.CartItem, { foreignKey: 'cart_id', as: 'items' });
    };

    return Cart;
};
