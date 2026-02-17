import { CartModel, CartItem } from '../models/cart.model';
import { ProductModel } from '../models/product.model';
import { ServiceModel } from '../models/service.model';

const normalizeCartItem = (item: any) => {
    const unitPrice = Number(item.unit_price ?? item.product_price ?? item.service_price ?? 0);
    const qty = Number(item.qty ?? 0);

    return {
        // Canonical cart payload fields
        cart_item_id: item.id,
        cart_id: item.cart_id,
        item_type: item.item_type,
        product_id: item.product_id ?? null,
        service_id: item.service_id ?? null,
        qty,
        unit_price: unitPrice,
        line_total: unitPrice * qty,
        booking_date: item.booking_date ?? null,
        booking_time: item.booking_time ?? null,
        address_id: item.address_id ?? null,
        notes: item.notes ?? null,
        product: item.product_id ? {
            id: item.product_id,
            name: item.product_name ?? null,
            price: Number(item.product_price ?? 0),
            image_url: item.product_image ?? null,
        } : null,
        service: item.service_id ? {
            id: item.service_id,
            name: item.service_name ?? null,
            price: Number(item.service_price ?? 0),
            image_url: item.service_image ?? null,
        } : null,

        // Backward-compatible aliases used by existing frontend store
        id: item.id,
        product_name: item.product_name ?? null,
        product_price: item.product_price != null ? Number(item.product_price) : null,
        product_image: item.product_image ?? null,
        service_name: item.service_name ?? null,
        service_price: item.service_price != null ? Number(item.service_price) : null,
        service_image: item.service_image ?? null,
    };
};

const buildCartResponse = async (userId: number) => {
    let cart = await CartModel.findOpenCart(userId);
    if (!cart) {
        const cartId = await CartModel.createCart(userId);
        cart = { id: cartId, user_id: userId, status: 'open' };
    }

    const rawItems = await CartModel.getCartItems(cart.id);
    const items = rawItems.map(normalizeCartItem);

    return {
        cart_id: cart.id,
        user_id: cart.user_id,
        status: cart.status,
        items,
        // Backward-compatible alias for old clients
        id: cart.id,
    };
};

export const CartService = {
    async getCart(userId: number) {
        return buildCartResponse(userId);
    },

    async addItem(userId: number, data: CartItem) {
        // Ensure cart exists
        let cart = await CartModel.findOpenCart(userId);
        if (!cart) {
            const cartId = await CartModel.createCart(userId);
            cart = { id: cartId, user_id: userId, status: 'open' };
        }

        // Validation & Price snapshot
        let unitPrice = 0;
        if (data.item_type === 'product' && data.product_id) {
            const product = await ProductModel.findById(data.product_id);
            if (!product) throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
            unitPrice = Number(product.price);
        } else if (data.item_type === 'service' && data.service_id) {
            const service = await ServiceModel.findById(data.service_id);
            if (!service) throw { type: 'AppError', message: 'Service not found', statusCode: 404 };
            unitPrice = Number(service.base_price);
        } else {
            throw { type: 'AppError', message: 'Invalid cart payload', statusCode: 400 };
        }

        await CartModel.addItem({ ...data, cart_id: cart!.id, unit_price: unitPrice });
        return buildCartResponse(userId);
    },

    async updateItem(userId: number, itemId: number, data: Partial<CartItem>) {
        const isOwner = await CartModel.verifyItemOwnership(itemId, userId);
        if (!isOwner) throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };

        if (data.qty === 0) {
            await CartModel.removeItem(itemId);
            return buildCartResponse(userId);
        }

        await CartModel.updateItem(itemId, data);
        return buildCartResponse(userId);
    },

    async removeItem(userId: number, itemId: number) {
        const isOwner = await CartModel.verifyItemOwnership(itemId, userId);
        if (!isOwner) throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };

        await CartModel.removeItem(itemId);
        return buildCartResponse(userId);
    }
};
