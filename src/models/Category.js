export default (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: 'categories',
        timestamps: false,
        paranoid: true,
        deletedAt: 'deleted_at',
    });

    Category.associate = (models) => {
        Category.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
        Category.hasMany(models.ProductCategory, { foreignKey: 'category_id', as: 'productCategories' });
    };

    return Category;
};
