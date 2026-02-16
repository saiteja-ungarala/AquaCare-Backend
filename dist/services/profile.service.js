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
            // Auto-generate referral code for legacy users who don't have one
            if (!user.referral_code) {
                const code = (0, user_model_1.generateReferralCode)();
                yield user_model_1.UserModel.update(userId, { referral_code: code });
                user.referral_code = code;
            }
            const { password_hash } = user, rest = __rest(user, ["password_hash"]);
            return rest;
        });
    },
    updateProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Whitelist only allowed fields
            const allowed = {};
            if (data.full_name !== undefined)
                allowed.full_name = data.full_name;
            if (data.phone !== undefined)
                allowed.phone = data.phone;
            if (Object.keys(allowed).length === 0) {
                throw { type: 'AppError', message: 'No valid fields to update', statusCode: 400 };
            }
            yield user_model_1.UserModel.update(userId, allowed);
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
            const allowed = {};
            if (data.label !== undefined)
                allowed.label = data.label;
            if (data.line1 !== undefined)
                allowed.line1 = data.line1;
            if (data.line2 !== undefined)
                allowed.line2 = data.line2;
            if (data.city !== undefined)
                allowed.city = data.city;
            if (data.state !== undefined)
                allowed.state = data.state;
            if (data.postal_code !== undefined)
                allowed.postal_code = data.postal_code;
            if (data.country !== undefined)
                allowed.country = data.country;
            if (data.latitude !== undefined)
                allowed.latitude = data.latitude;
            if (data.longitude !== undefined)
                allowed.longitude = data.longitude;
            if (data.is_default !== undefined)
                allowed.is_default = data.is_default;
            if (Object.keys(allowed).length === 0) {
                throw { type: 'AppError', message: 'No valid fields to update', statusCode: 400 };
            }
            yield address_model_1.AddressModel.update(addressId, allowed);
            if (allowed.is_default) {
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
    },
    setAddressDefault(userId, addressId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield address_model_1.AddressModel.findById(addressId);
            if (!existing || existing.user_id !== userId) {
                throw { type: 'AppError', message: 'Address not found', statusCode: 404 };
            }
            yield address_model_1.AddressModel.setDefault(userId, addressId);
            return address_model_1.AddressModel.findAll(userId);
        });
    }
};
