export default (sequelize, DataTypes) => {
    const ProductCategory = sequelize.define('ProductCategory', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        category_id: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        tableName: 'product_categories',
        timestamps: false,
    });

    ProductCategory.associate = (models) => {
        ProductCategory.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
        ProductCategory.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    };

    return ProductCategory;
};
