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
exports.checkout = exports.getOrderById = exports.getOrders = void 0;
const orders_service_1 = require("../services/orders.service");
const response_1 = require("../utils/response");
const getOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield orders_service_1.OrderService.getOrders(userId, req.query);
        return (0, response_1.successResponse)(res, result.data);
    }
    catch (error) {
        next(error);
    }
});
exports.getOrders = getOrders;
const getOrderById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const orderId = Number(req.params.id);
        const result = yield orders_service_1.OrderService.getOrderById(userId, orderId);
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.getOrderById = getOrderById;
const checkout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield orders_service_1.OrderService.checkout(userId, req.body);
        return (0, response_1.successResponse)(res, result, 'Order placed successfully', 201);
    }
    catch (error) {
        next(error);
    }
});
exports.checkout = checkout;
