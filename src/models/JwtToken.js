export default (sequelize, DataTypes) => {
    const JwtToken = sequelize.define('JwtToken', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        token: { type: DataTypes.TEXT, allowNull: false },
        type: {
            type: DataTypes.ENUM('refresh', 'reset'),
            allowNull: false,
        },
        expires_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        tableName: 'jwt_tokens',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
    });

    JwtToken.associate = (models) => {
        JwtToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    };

    return JwtToken;
};
