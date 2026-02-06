"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const cart_model_1 = require("../models/cart.model");
const product_model_1 = require("../models/product.model");
const service_model_1 = require("../models/service.model");
exports.CartService = {
    getCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let cart = yield cart_model_1.CartModel.findOpenCart(userId);
            if (!cart) {
                const cartId = yield cart_model_1.CartModel.createCart(userId);
                cart = yield cart_model_1.CartModel.findOpenCart(userId);
            }
            // items
            const items = yield cart_model_1.CartModel.getCartItems(cart.id);
            return Object.assign(Object.assign({}, cart), { items });
        });
    },
    addItem(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure cart exists
            let cart = yield cart_model_1.CartModel.findOpenCart(userId);
            if (!cart) {
                const cartId = yield cart_model_1.CartModel.createCart(userId);
                cart = { id: cartId, user_id: userId, status: 'open' };
            }
            // Validation & Price snapshot
            let unitPrice = 0;
            if (data.item_type === 'product' && data.product_id) {
                const product = yield product_model_1.ProductModel.findById(data.product_id);
                if (!product)
                    throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
                unitPrice = Number(product.price);
            }
            else if (data.item_type === 'service' && data.service_id) {
                const service = yield service_model_1.ServiceModel.findById(data.service_id);
                if (!service)
                    throw { type: 'AppError', message: 'Service not found', statusCode: 404 };
                unitPrice = Number(service.base_price);
            }
            yield cart_model_1.CartModel.addItem(Object.assign(Object.assign({}, data), { cart_id: cart.id, unit_price: unitPrice }));
            return this.getCart(userId);
        });
    },
    updateItem(userId, itemId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const isOwner = yield cart_model_1.CartModel.verifyItemOwnership(itemId, userId);
            if (!isOwner)
                throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };
            yield cart_model_1.CartModel.updateItem(itemId, data);
            return this.getCart(userId);
        });
    },
    removeItem(userId, itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            const isOwner = yield cart_model_1.CartModel.verifyItemOwnership(itemId, userId);
            if (!isOwner)
                throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };
            yield cart_model_1.CartModel.removeItem(itemId);
            return this.getCart(userId);
        });
    }
};
