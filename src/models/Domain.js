export default (sequelize, DataTypes) => {
    const Domain = sequelize.define('Domain', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false },
        domain: { type: DataTypes.STRING, allowNull: false, unique: true },
        is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        tableName: 'domains',
        timestamps: false,
    });

    Domain.associate = (models) => {
        Domain.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    };

    return Domain;
};
