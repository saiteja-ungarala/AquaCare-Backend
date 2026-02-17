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
const normalizeCartItem = (item) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    const unitPrice = Number((_c = (_b = (_a = item.unit_price) !== null && _a !== void 0 ? _a : item.product_price) !== null && _b !== void 0 ? _b : item.service_price) !== null && _c !== void 0 ? _c : 0);
    const qty = Number((_d = item.qty) !== null && _d !== void 0 ? _d : 0);
    return {
        // Canonical cart payload fields
        cart_item_id: item.id,
        cart_id: item.cart_id,
        item_type: item.item_type,
        product_id: (_e = item.product_id) !== null && _e !== void 0 ? _e : null,
        service_id: (_f = item.service_id) !== null && _f !== void 0 ? _f : null,
        qty,
        unit_price: unitPrice,
        line_total: unitPrice * qty,
        booking_date: (_g = item.booking_date) !== null && _g !== void 0 ? _g : null,
        booking_time: (_h = item.booking_time) !== null && _h !== void 0 ? _h : null,
        address_id: (_j = item.address_id) !== null && _j !== void 0 ? _j : null,
        notes: (_k = item.notes) !== null && _k !== void 0 ? _k : null,
        product: item.product_id ? {
            id: item.product_id,
            name: (_l = item.product_name) !== null && _l !== void 0 ? _l : null,
            price: Number((_m = item.product_price) !== null && _m !== void 0 ? _m : 0),
            image_url: (_o = item.product_image) !== null && _o !== void 0 ? _o : null,
        } : null,
        service: item.service_id ? {
            id: item.service_id,
            name: (_p = item.service_name) !== null && _p !== void 0 ? _p : null,
            price: Number((_q = item.service_price) !== null && _q !== void 0 ? _q : 0),
            image_url: (_r = item.service_image) !== null && _r !== void 0 ? _r : null,
        } : null,
        // Backward-compatible aliases used by existing frontend store
        id: item.id,
        product_name: (_s = item.product_name) !== null && _s !== void 0 ? _s : null,
        product_price: item.product_price != null ? Number(item.product_price) : null,
        product_image: (_t = item.product_image) !== null && _t !== void 0 ? _t : null,
        service_name: (_u = item.service_name) !== null && _u !== void 0 ? _u : null,
        service_price: item.service_price != null ? Number(item.service_price) : null,
        service_image: (_v = item.service_image) !== null && _v !== void 0 ? _v : null,
    };
};
const buildCartResponse = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    let cart = yield cart_model_1.CartModel.findOpenCart(userId);
    if (!cart) {
        const cartId = yield cart_model_1.CartModel.createCart(userId);
        cart = { id: cartId, user_id: userId, status: 'open' };
    }
    const rawItems = yield cart_model_1.CartModel.getCartItems(cart.id);
    const items = rawItems.map(normalizeCartItem);
    return {
        cart_id: cart.id,
        user_id: cart.user_id,
        status: cart.status,
        items,
        // Backward-compatible alias for old clients
        id: cart.id,
    };
});
exports.CartService = {
    getCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return buildCartResponse(userId);
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
            else {
                throw { type: 'AppError', message: 'Invalid cart payload', statusCode: 400 };
            }
            yield cart_model_1.CartModel.addItem(Object.assign(Object.assign({}, data), { cart_id: cart.id, unit_price: unitPrice }));
            return buildCartResponse(userId);
        });
    },
    updateItem(userId, itemId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const isOwner = yield cart_model_1.CartModel.verifyItemOwnership(itemId, userId);
            if (!isOwner)
                throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };
            if (data.qty === 0) {
                yield cart_model_1.CartModel.removeItem(itemId);
                return buildCartResponse(userId);
            }
            yield cart_model_1.CartModel.updateItem(itemId, data);
            return buildCartResponse(userId);
        });
    },
    removeItem(userId, itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            const isOwner = yield cart_model_1.CartModel.verifyItemOwnership(itemId, userId);
            if (!isOwner)
                throw { type: 'AppError', message: 'Item not found in your cart', statusCode: 404 };
            yield cart_model_1.CartModel.removeItem(itemId);
            return buildCartResponse(userId);
        });
    }
};
