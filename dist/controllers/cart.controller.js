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
exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const cart_service_1 = require("../services/cart.service");
const response_1 = require("../utils/response");
const getCart = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield cart_service_1.CartService.getCart(userId);
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.getCart = getCart;
const addItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield cart_service_1.CartService.addItem(userId, req.body);
        return (0, response_1.successResponse)(res, result, 'Item added to cart', 201);
    }
    catch (error) {
        next(error);
    }
});
exports.addItem = addItem;
const updateItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const itemId = Number(req.params.id);
        const result = yield cart_service_1.CartService.updateItem(userId, itemId, req.body);
        return (0, response_1.successResponse)(res, result, 'Cart item updated');
    }
    catch (error) {
        next(error);
    }
});
exports.updateItem = updateItem;
const removeItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const itemId = Number(req.params.id);
        const result = yield cart_service_1.CartService.removeItem(userId, itemId);
        return (0, response_1.successResponse)(res, result, 'Item removed from cart');
    }
    catch (error) {
        next(error);
    }
});
exports.removeItem = removeItem;
