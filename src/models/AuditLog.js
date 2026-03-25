export default (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: true },
        action: { type: DataTypes.STRING, allowNull: false },
        entity: { type: DataTypes.STRING, allowNull: true },
        entity_id: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'audit_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });

    AuditLog.associate = (models) => {
        AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        AuditLog.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    };

    return AuditLog;
};
