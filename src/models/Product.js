export default (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        reserved_stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        images: { type: DataTypes.JSON, allowNull: true },
        visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        slug: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: 'products',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
        indexes: [
            { unique: true, fields: ['slug', 'tenant_id'] },
        ],
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
        Product.hasMany(models.ProductVariant, { foreignKey: 'product_id', as: 'variants' });
        Product.hasMany(models.ProductCategory, { foreignKey: 'product_id', as: 'productCategories' });
        Product.hasMany(models.CartItem, { foreignKey: 'product_id', as: 'cartItems' });
    };

    return Product;
};
