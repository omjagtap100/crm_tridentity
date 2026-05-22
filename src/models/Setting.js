export default (sequelize, DataTypes) => {
    const Setting = sequelize.define('Setting', {
        key: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        value: { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'settings',
        timestamps: false,
    });

    return Setting;
};
