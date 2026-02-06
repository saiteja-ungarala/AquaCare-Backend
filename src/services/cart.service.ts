import { CartModel, CartItem } from '../models/cart.model';
import { ProductModel } from '../models/product.model';
import { ServiceModel } from '../models/service.model';

export const CartService = {
    async getCart(userId: number) {
        let cart = await CartModel.findOpenCart(userId);
        if (!cart) {
            const cartId = await CartModel.createCart(userId);
            cart = await CartModel.findOpenCart(userId)!;
        }

        // items
        const items = await CartModel.getCartItems(cart!.id);
        return { ...cart, items };
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
        }

        await CartModel.addItem({ ...data, cart_id: cart!.id, unit_price: unitPrice });
        return this.getCart(userId);
    },

    async updateItem(userId: number, itemId: number, data: Partial<CartItem>) {
        const isOwner = await CartModel.verifyItemOwnership(itemId, userId);
        if (!isOwner) throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };

        await CartModel.updateItem(itemId, data);
        return this.getCart(userId);
    },

    async removeItem(userId: number, itemId: number) {
        const isOwner = await CartModel.verifyItemOwnership(itemId, userId);
        if (!isOwner) throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };

        await CartModel.removeItem(itemId);
        return this.getCart(userId);
    }
};
