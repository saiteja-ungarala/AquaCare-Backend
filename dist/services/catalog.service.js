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
exports.CatalogService = void 0;
const service_model_1 = require("../models/service.model");
const product_model_1 = require("../models/product.model");
exports.CatalogService = {
    getServices(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.pageSize) || 10;
            const offset = (page - 1) * limit;
            const { services, total } = yield service_model_1.ServiceModel.findAll({
                category: query.category,
                search: query.searchQuery,
                limit,
                offset,
            });
            return {
                data: services,
                pagination: {
                    page,
                    pageSize: limit,
                    totalItems: total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getServiceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = yield service_model_1.ServiceModel.findById(id);
            if (!service)
                throw { type: 'AppError', message: 'Service not found', statusCode: 404 };
            return service;
        });
    },
    getProducts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.pageSize) || 10;
            const offset = (page - 1) * limit;
            const { products, total } = yield product_model_1.ProductModel.findAll({
                category: query.category,
                search: query.searchQuery,
                limit,
                offset,
            });
            return {
                data: products,
                pagination: {
                    page,
                    pageSize: limit,
                    totalItems: total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getProductById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield product_model_1.ProductModel.findById(id);
            if (!product)
                throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
            return product;
        });
    },
};
