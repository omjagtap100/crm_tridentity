export default (sequelize, DataTypes) => {
    const ProductVariant = sequelize.define('ProductVariant', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'product_variants',
        timestamps: false,
    });

    ProductVariant.associate = (models) => {
        ProductVariant.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    };

    return ProductVariant;
};
