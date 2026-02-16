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

        const allowed: Partial<Address> = {};
        if (data.label !== undefined) allowed.label = data.label;
        if (data.line1 !== undefined) allowed.line1 = data.line1;
        if (data.line2 !== undefined) allowed.line2 = data.line2;
        if (data.city !== undefined) allowed.city = data.city;
        if (data.state !== undefined) allowed.state = data.state;
        if (data.postal_code !== undefined) allowed.postal_code = data.postal_code;
        if (data.country !== undefined) allowed.country = data.country;
        if (data.latitude !== undefined) allowed.latitude = data.latitude;
        if (data.longitude !== undefined) allowed.longitude = data.longitude;
        if (data.is_default !== undefined) allowed.is_default = data.is_default;

        if (Object.keys(allowed).length === 0) {
            throw { type: 'AppError', message: 'No valid fields to update', statusCode: 400 };
        }

        await AddressModel.update(addressId, allowed);

        if (allowed.is_default) {
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
