export default (sequelize, DataTypes) => {
    const Tenant = sequelize.define('Tenant', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        tableName: 'tenants',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: false,
        deletedAt: 'deleted_at',
    });

    Tenant.associate = (models) => {
        Tenant.hasMany(models.Domain, { foreignKey: 'tenant_id', as: 'domains' });
        Tenant.hasMany(models.User, { foreignKey: 'tenant_id', as: 'users' });
        Tenant.hasMany(models.Product, { foreignKey: 'tenant_id', as: 'products' });
        Tenant.hasMany(models.Category, { foreignKey: 'tenant_id', as: 'categories' });
        Tenant.hasMany(models.Cart, { foreignKey: 'tenant_id', as: 'carts' });
        Tenant.hasMany(models.File, { foreignKey: 'tenant_id', as: 'files' });
        Tenant.hasMany(models.AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
        Tenant.hasOne(models.ThemeSetting, { foreignKey: 'tenant_id', as: 'theme' });
    };

    return Tenant;
};
