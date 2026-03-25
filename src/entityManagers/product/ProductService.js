import { MODELS } from '../../sequelize.js';
import { ApiError } from '../../helper/ApiError.js';
import { Op } from 'sequelize';

export class ProductService {

    static async getAll(tenantId, { page = 1, limit = 20, visible } = {}) {
        const where = { tenant_id: tenantId };
        if (visible !== undefined) where.visible = visible;

        const offset = (page - 1) * limit;
        const { count, rows } = await MODELS.Product.findAndCountAll({
            where,
            include: [
                { model: MODELS.ProductVariant, as: 'variants' },
                { model: MODELS.ProductCategory, as: 'productCategories', include: [{ model: MODELS.Category, as: 'category' }] },
            ],
            limit: parseInt(limit),
            offset,
            order: [['id', 'DESC']],
        });

        return { total: count, page: parseInt(page), limit: parseInt(limit), products: rows };
    }

    static async getBySlug(tenantId, slug) {
        const product = await MODELS.Product.findOne({
            where: { tenant_id: tenantId, slug },
            include: [
                { model: MODELS.ProductVariant, as: 'variants' },
                { model: MODELS.ProductCategory, as: 'productCategories', include: [{ model: MODELS.Category, as: 'category' }] },
            ],
        });
        if (!product) throw new ApiError(404, 'Product not found');
        return product;
    }

    static async getById(tenantId, id) {
        const product = await MODELS.Product.findOne({
            where: { tenant_id: tenantId, id },
            include: [{ model: MODELS.ProductVariant, as: 'variants' }],
        });
        if (!product) throw new ApiError(404, 'Product not found');
        return product;
    }

    static async create(tenantId, data) {
        const { name, description, price, stock, images, visible, slug, categoryIds } = data;

        const existing = await MODELS.Product.findOne({ where: { tenant_id: tenantId, slug } });
        if (existing) throw new ApiError(409, `Slug '${slug}' already exists for this store`);

        const product = await MODELS.Product.create({
            tenant_id: tenantId, name, description, price, stock, reserved_stock: 0,
            images, visible: visible !== undefined ? visible : true, slug,
        });

        if (categoryIds && categoryIds.length > 0) {
            await ProductService._syncCategories(product.id, tenantId, categoryIds);
        }

        return ProductService.getById(tenantId, product.id);
    }

    static async update(tenantId, id, data) {
        const product = await ProductService.getById(tenantId, id);
        const { categoryIds, ...updateData } = data;

        await product.update(updateData);

        if (categoryIds !== undefined) {
            await MODELS.ProductCategory.destroy({ where: { product_id: id } });
            await ProductService._syncCategories(id, tenantId, categoryIds);
        }

        return ProductService.getById(tenantId, id);
    }

    static async delete(tenantId, id) {
        const product = await ProductService.getById(tenantId, id);
        await product.destroy();
        return { message: 'Product deleted' };
    }

    static async _syncCategories(productId, tenantId, categoryIds) {
        for (const categoryId of categoryIds) {
            const cat = await MODELS.Category.findOne({ where: { id: categoryId, tenant_id: tenantId } });
            if (!cat) throw new ApiError(404, `Category ${categoryId} not found for this tenant`);
            await MODELS.ProductCategory.create({ product_id: productId, category_id: categoryId });
        }
    }
}
