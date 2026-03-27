import { AppError } from '@core/errors/AppError';
import { Wallet, WalletType } from '@prisma/client';
import { CreateWalletInput, UpdateWalletInput, WalletsRepository } from './wallets.repository';

type CreateWalletPayload = {
  name: string;
  walletType?: WalletType;
  icon?: string;
  creditLimit?: number;
};

type UpdateWalletPayload = {
  name?: string;
  walletType?: WalletType;
  icon?: string;
  creditLimit?: number;
  balance?: number;
};

/**
 * Layer: Use Case (pure business logic)
 * Feature: Wallets
 */
export class WalletsUseCase {
  private repository = new WalletsRepository();

  async getAllWallets(userId: string): Promise<Wallet[]> {
    if (!userId) throw new AppError('Unauthorized', 401);
    return this.repository.findAllByUserId(userId);
  }

  async getWalletById(userId: string, walletId: string): Promise<Wallet> {
    if (!userId) throw new AppError('Unauthorized', 401);

    const wallet = await this.repository.findById(walletId);

    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found', 404);
    }

    return wallet;
  }

  async createWallet(
    userId: string,
    data: CreateWalletPayload
  ): Promise<Wallet> {
    if (!userId) throw new AppError('Unauthorized', 401);

    const name = data.name?.trim();
    if (!name) {
      throw new AppError('Wallet name is required', 400);
    }

    const walletType = data.walletType || WalletType.CASH;
    const creditLimit = walletType === WalletType.CREDIT ? (data.creditLimit ?? 0) : 0;
    if (creditLimit < 0) {
      throw new AppError('Credit limit must be greater than or equal to 0', 400);
    }

    const createData: CreateWalletInput = {
      userId,
      name,
      walletType,
      icon: data.icon,
      creditLimit,
    };

    return this.repository.create(createData);
  }

  async updateWallet(
    userId: string,
    walletId: string,
    data: UpdateWalletPayload
  ): Promise<Wallet> {
    await this.getWalletById(userId, walletId);

    if (typeof data.balance !== 'undefined') {
      throw new AppError('Wallet balance cannot be updated directly', 400);
    }

    const payload: UpdateWalletInput = {
      name: data.name?.trim(),
      walletType: data.walletType,
      icon: data.icon,
      creditLimit: data.creditLimit,
    };

    if (payload.name === '') {
      throw new AppError('Wallet name cannot be empty', 400);
    }

    if (payload.walletType && payload.walletType !== WalletType.CREDIT) {
      payload.creditLimit = 0;
    }

    if (typeof payload.creditLimit !== 'undefined' && payload.creditLimit !== null && payload.creditLimit < 0) {
      throw new AppError('Credit limit must be greater than or equal to 0', 400);
    }

    return this.repository.update(walletId, payload);
  }

  async deleteWallet(userId: string, walletId: string): Promise<void> {
    await this.getWalletById(userId, walletId);

    const existingTransactions = await this.repository.countTransactionsByWalletId(walletId);
    if (existingTransactions > 0) {
      throw new AppError('Cannot delete wallet with existing transactions', 400);
    }

    await this.repository.delete(walletId);
  }
}
