import { UserModel, User } from '../models/user.model';
import { AddressModel, Address } from '../models/address.model';

export const ProfileService = {
    async getProfile(userId: number) {
        const user = await UserModel.findById(userId);
        if (!user) throw { type: 'AppError', message: 'User not found', statusCode: 404 };

        const { password_hash, ...rest } = user;
        return rest;
    },

    async updateProfile(userId: number, data: Partial<User>) {
        await UserModel.update(userId, data);
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
    }
};
