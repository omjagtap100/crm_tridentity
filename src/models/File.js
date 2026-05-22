export default (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false },
        url: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: true },
    }, {
        tableName: 'files',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });

    File.associate = (models) => {
        File.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    };

    return File;
};
