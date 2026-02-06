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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const user_model_1 = require("../models/user.model");
const address_model_1 = require("../models/address.model");
exports.ProfileService = {
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.UserModel.findById(userId);
            if (!user)
                throw { type: 'AppError', message: 'User not found', statusCode: 404 };
            const { password_hash } = user, rest = __rest(user, ["password_hash"]);
            return rest;
        });
    },
    updateProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_model_1.UserModel.update(userId, data);
            return this.getProfile(userId);
        });
    },
    getAddresses(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return address_model_1.AddressModel.findAll(userId);
        });
    },
    addAddress(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const addressId = yield address_model_1.AddressModel.create(Object.assign(Object.assign({}, data), { user_id: userId }));
            // If set as default, update others
            if (data.is_default) {
                yield address_model_1.AddressModel.setDefault(userId, addressId);
            }
            return address_model_1.AddressModel.findById(addressId);
        });
    },
    updateAddress(userId, addressId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield address_model_1.AddressModel.findById(addressId);
            if (!existing || existing.user_id !== userId) {
                throw { type: 'AppError', message: 'Address not found', statusCode: 404 };
            }
            yield address_model_1.AddressModel.update(addressId, data);
            if (data.is_default) {
                yield address_model_1.AddressModel.setDefault(userId, addressId);
            }
            return address_model_1.AddressModel.findById(addressId);
        });
    },
    deleteAddress(userId, addressId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield address_model_1.AddressModel.findById(addressId);
            if (!existing || existing.user_id !== userId) {
                throw { type: 'AppError', message: 'Address not found or unauthorized', statusCode: 404 };
            }
            yield address_model_1.AddressModel.delete(addressId);
        });
    }
};
