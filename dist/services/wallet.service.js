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
exports.WalletService = void 0;
const wallet_model_1 = require("../models/wallet.model");
exports.WalletService = {
    getWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const balance = yield wallet_model_1.WalletModel.getBalance(userId);
            return { balance };
        });
    },
    getTransactions(userId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.pageSize) || 20;
            const offset = (page - 1) * limit;
            const transactions = yield wallet_model_1.WalletModel.getTransactions(userId, limit, offset);
            return transactions;
        });
    }
};
