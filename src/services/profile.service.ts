import { UserModel, User, generateReferralCode } from '../models/user.model';
import { AddressModel, Address } from '../models/address.model';

export const ProfileService = {
    async getProfile(userId: number) {
        const user = await UserModel.findById(userId);
        if (!user) throw { type: 'AppError', message: 'User not found', statusCode: 404 };

        // Auto-generate referral code for legacy users who don't have one
        if (!user.referral_code) {
            const code = generateReferralCode();
            await UserModel.update(userId, { referral_code: code } as Partial<User>);
            user.referral_code = code;
        }

        const { password_hash, ...rest } = user;
        return rest;
    },

    async updateProfile(userId: number, data: Partial<User>) {
        // Whitelist only allowed fields
        const allowed: Partial<User> = {};
        if (data.full_name !== undefined) allowed.full_name = data.full_name;
        if (data.phone !== undefined) allowed.phone = data.phone;

        if (Object.keys(allowed).length === 0) {
            throw { type: 'AppError', message: 'No valid fields to update', statusCode: 400 };
        }

        await UserModel.update(userId, allowed);
        return this.getProfile(userId);
    },

    async getAddresses(userId: number) {
        return AddressModel.findAll(userId);
    },

    async addAddress(userId: number, data: Partial<Address>) {
        const addressId = await AddressModel.create({ ...data, user_id: userId });

        // If set as default, update others
        if (data.is_default) {
            await AddressModel.setDefault(userId, addressId);
        }

        return AddressModel.findById(addressId);
    },

    async updateAddress(userId: number, addressId: number, data: Partial<Address>) {
        const existing = await AddressModel.findById(addressId);
        if (!existing || existing.user_id !== userId) {
            throw { type: 'AppError', message: 'Address not found', statusCode: 404 };
        }

        await AddressModel.update(addressId, data);

        if (data.is_default) {
            await AddressModel.setDefault(userId, addressId);
        }

        return AddressModel.findById(addressId);
    },

    async deleteAddress(userId: number, addressId: number) {
        const existing = await AddressModel.findById(addressId);
        if (!existing || existing.user_id !== userId) {
            throw { type: 'AppError', message: 'Address not found or unauthorized', statusCode: 404 };
        }
        await AddressModel.delete(addressId);
    },

    async setAddressDefault(userId: number, addressId: number) {
        const existing = await AddressModel.findById(addressId);
        if (!existing || existing.user_id !== userId) {
            throw { type: 'AppError', message: 'Address not found', statusCode: 404 };
        }
        await AddressModel.setDefault(userId, addressId);
        return AddressModel.findAll(userId);
    }
};
