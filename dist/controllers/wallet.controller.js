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
exports.getTransactions = exports.getWallet = void 0;
const wallet_service_1 = require("../services/wallet.service");
const response_1 = require("../utils/response");
const getWallet = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield wallet_service_1.WalletService.getWallet(userId);
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.getWallet = getWallet;
const getTransactions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield wallet_service_1.WalletService.getTransactions(userId, req.query);
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.getTransactions = getTransactions;
