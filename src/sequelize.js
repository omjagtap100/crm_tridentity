import Sequelize from 'sequelize';
import dbConfig from './config/config.js';
import dotenv from 'dotenv';
dotenv.config();

import TenantModel from './models/Tenant.js';
import DomainModel from './models/Domain.js';
import UserModel from './models/User.js';
import JwtTokenModel from './models/JwtToken.js';
import ProductModel from './models/Product.js';
import CategoryModel from './models/Category.js';
import ProductCategoryModel from './models/ProductCategory.js';
import ProductVariantModel from './models/ProductVariant.js';
import CartModel from './models/Cart.js';
import CartItemModel from './models/CartItem.js';
import ThemeSettingModel from './models/ThemeSetting.js';
import FileModel from './models/File.js';
import AuditLogModel from './models/AuditLog.js';
import SettingModel from './models/Setting.js';

export let sequelize;
export const MODELS = {};

export const startConnection = async () => {
    sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Register models
    MODELS.Tenant = TenantModel(sequelize, Sequelize);
    MODELS.Domain = DomainModel(sequelize, Sequelize);
    MODELS.User = UserModel(sequelize, Sequelize);
    MODELS.JwtToken = JwtTokenModel(sequelize, Sequelize);
    MODELS.Product = ProductModel(sequelize, Sequelize);
    MODELS.Category = CategoryModel(sequelize, Sequelize);
    MODELS.ProductCategory = ProductCategoryModel(sequelize, Sequelize);
    MODELS.ProductVariant = ProductVariantModel(sequelize, Sequelize);
    MODELS.Cart = CartModel(sequelize, Sequelize);
    MODELS.CartItem = CartItemModel(sequelize, Sequelize);
    MODELS.ThemeSetting = ThemeSettingModel(sequelize, Sequelize);
    MODELS.File = FileModel(sequelize, Sequelize);
    MODELS.AuditLog = AuditLogModel(sequelize, Sequelize);
    MODELS.Setting = SettingModel(sequelize, Sequelize);

    // ==============================
    // ASSOCIATIONS
    // ==============================

    // Tenant
    MODELS.Tenant.hasMany(MODELS.Domain, { foreignKey: 'tenant_id', as: 'domains' });
    MODELS.Tenant.hasMany(MODELS.User, { foreignKey: 'tenant_id', as: 'users' });
    MODELS.Tenant.hasMany(MODELS.Product, { foreignKey: 'tenant_id', as: 'products' });
    MODELS.Tenant.hasMany(MODELS.Category, { foreignKey: 'tenant_id', as: 'categories' });
    MODELS.Tenant.hasMany(MODELS.Cart, { foreignKey: 'tenant_id', as: 'carts' });
    MODELS.Tenant.hasMany(MODELS.File, { foreignKey: 'tenant_id', as: 'files' });
    MODELS.Tenant.hasMany(MODELS.AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
    MODELS.Tenant.hasOne(MODELS.ThemeSetting, { foreignKey: 'tenant_id', as: 'theme' });

    // Domain
    MODELS.Domain.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    // User
    MODELS.User.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    MODELS.User.hasMany(MODELS.JwtToken, { foreignKey: 'user_id', as: 'jwtTokens' });
    MODELS.User.hasMany(MODELS.Cart, { foreignKey: 'user_id', as: 'carts' });
    MODELS.User.hasMany(MODELS.AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

    // JwtToken
    MODELS.JwtToken.belongsTo(MODELS.User, { foreignKey: 'user_id', as: 'user' });

    // Product
    MODELS.Product.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    MODELS.Product.hasMany(MODELS.ProductVariant, { foreignKey: 'product_id', as: 'variants' });
    MODELS.Product.hasMany(MODELS.ProductCategory, { foreignKey: 'product_id', as: 'productCategories' });
    MODELS.Product.hasMany(MODELS.CartItem, { foreignKey: 'product_id', as: 'cartItems' });

    // Category
    MODELS.Category.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    MODELS.Category.hasMany(MODELS.ProductCategory, { foreignKey: 'category_id', as: 'productCategories' });

    // ProductCategory
    MODELS.ProductCategory.belongsTo(MODELS.Product, { foreignKey: 'product_id', as: 'product' });
    MODELS.ProductCategory.belongsTo(MODELS.Category, { foreignKey: 'category_id', as: 'category' });

    // ProductVariant
    MODELS.ProductVariant.belongsTo(MODELS.Product, { foreignKey: 'product_id', as: 'product' });

    // Cart
    MODELS.Cart.belongsTo(MODELS.User, { foreignKey: 'user_id', as: 'user' });
    MODELS.Cart.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    MODELS.Cart.hasMany(MODELS.CartItem, { foreignKey: 'cart_id', as: 'items' });

    // CartItem
    MODELS.CartItem.belongsTo(MODELS.Cart, { foreignKey: 'cart_id', as: 'cart' });
    MODELS.CartItem.belongsTo(MODELS.Product, { foreignKey: 'product_id', as: 'product' });

    // ThemeSetting
    MODELS.ThemeSetting.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    // File
    MODELS.File.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    // AuditLog
    MODELS.AuditLog.belongsTo(MODELS.User, { foreignKey: 'user_id', as: 'user' });
    MODELS.AuditLog.belongsTo(MODELS.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    console.log('All models and associations loaded.');
};

const getSequelize = () => {
    if (!sequelize) {
        const db = dbConfig[process.env.NODE_ENV || 'development'];
        sequelize = new Sequelize(db.database, db.username, db.password, {
            host: db.host,
            port: db.port,
            dialect: 'mysql',
            pool: { max: 20, min: 0, acquire: 30000, idle: 10000 },
            logging: false,
        });
    }
    return sequelize;
};
