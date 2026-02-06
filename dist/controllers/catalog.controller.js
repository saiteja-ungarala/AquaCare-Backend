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
exports.getProductById = exports.getProducts = exports.getServiceById = exports.getServices = void 0;
const catalog_service_1 = require("../services/catalog.service");
const response_1 = require("../utils/response");
const getServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield catalog_service_1.CatalogService.getServices(req.query);
        return (0, response_1.successResponse)(res, result.data, 'Services fetched'); // Simplified response wrapper might need adjustment for pagination in root
        // For now returning data directly inside standard wrapper.
        // Ideally pagination metadata should be top level or part of data wrapper.
        // Let's adhere to "Consistent response format { success: true, data }"
        // So data will contain { list, pagination }
    }
    catch (error) {
        next(error);
    }
});
exports.getServices = getServices;
const getServiceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield catalog_service_1.CatalogService.getServiceById(Number(req.params.id));
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.getServiceById = getServiceById;
const getProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield catalog_service_1.CatalogService.getProducts(req.query);
        return (0, response_1.successResponse)(res, result.data);
    }
    catch (error) {
        next(error);
    }
});
exports.getProducts = getProducts;
const getProductById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield catalog_service_1.CatalogService.getProductById(Number(req.params.id));
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.getProductById = getProductById;
