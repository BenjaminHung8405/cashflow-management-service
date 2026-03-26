import { AppError } from '@core/errors/AppError';
import { Wallet, WalletType } from '@prisma/client';
import { WalletsRepository } from './wallets.repository';

/**
 * Layer: Use Case (pure business logic)
 * Feature: Wallets
 */
export class WalletsUseCase {
  private repository = new WalletsRepository();

  async getAllWallets(userId: string): Promise<Wallet[]> {
    return this.repository.findAllByUserId(userId);
  }

  async getWalletById(userId: string, walletId: string): Promise<Wallet> {
    const wallet = await this.repository.findById(walletId);
    
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found', 404);
    }

    return wallet;
  }

  async createWallet(
    userId: string,
    data: { name: string; walletType?: WalletType; icon?: string; creditLimit?: number }
  ): Promise<Wallet> {
    if (!data.name) {
      throw new AppError('Wallet name is required', 400);
    }

    return this.repository.create({
      userId,
      name: data.name,
      walletType: data.walletType || WalletType.CASH,
      icon: data.icon,
      creditLimit: data.creditLimit,
    });
  }

  async updateWallet(
    userId: string,
    walletId: string,
    data: Partial<Wallet>
  ): Promise<Wallet> {
    const wallet = await this.getWalletById(userId, walletId);

    return this.repository.update(walletId, {
      ...data,
      id: wallet.id,
      userId: wallet.userId,
      createdAt: wallet.createdAt,
      updatedAt: new Date(),
    });
  }

  async deleteWallet(userId: string, walletId: string): Promise<void> {
    const wallet = await this.getWalletById(userId, walletId);
    await this.repository.delete(walletId);
  }
}
