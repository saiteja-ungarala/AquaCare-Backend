import { WalletModel } from '../models/wallet.model';

export const WalletService = {
    async getWallet(userId: number) {
        const balance = await WalletModel.getBalance(userId);
        return { balance };
    },

    async getTransactions(userId: number, query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.pageSize as string) || 20;
        const offset = (page - 1) * limit;

        const transactions = await WalletModel.getTransactions(userId, limit, offset);
        return transactions;
    }
};
