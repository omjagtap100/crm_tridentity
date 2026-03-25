export default (sequelize, DataTypes) => {
    const ThemeSetting = sequelize.define('ThemeSetting', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        primary_color: { type: DataTypes.STRING, allowNull: true },
        logo_url: { type: DataTypes.STRING, allowNull: true },
        banner_url: { type: DataTypes.STRING, allowNull: true },
        layout_config: { type: DataTypes.JSON, allowNull: true },
    }, {
        tableName: 'theme_settings',
        timestamps: false,
    });

    ThemeSetting.associate = (models) => {
        ThemeSetting.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    };

    return ThemeSetting;
};
