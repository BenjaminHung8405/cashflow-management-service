import { prisma } from '@core/config/database';
import { Wallet, WalletType } from '@prisma/client';

export type CreateWalletInput = {
  userId: string;
  name: string;
  walletType: WalletType;
  icon?: string | null;
  creditLimit?: number | null;
};

export type UpdateWalletInput = {
  name?: string;
  walletType?: WalletType;
  icon?: string | null;
  creditLimit?: number | null;
};

/**
 * Layer: Repository (ONLY place for database queries)
 * Feature: Wallets
 */
export class WalletsRepository {
  async findAllByUserId(userId: string): Promise<Wallet[]> {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({
      where: { id },
    });
  }

  async create(data: CreateWalletInput): Promise<Wallet> {
    return prisma.wallet.create({
      data: {
        userId: data.userId,
        name: data.name,
        walletType: data.walletType,
        icon: data.icon ?? null,
        creditLimit: data.creditLimit ?? 0,
        balance: 0,
      },
    });
  }

  async update(id: string, data: UpdateWalletInput): Promise<Wallet> {
    return prisma.wallet.update({
      where: { id },
      data,
    });
  }

  async countTransactionsByWalletId(walletId: string): Promise<number> {
    return prisma.transaction.count({
      where: {
        walletId,
        isDeleted: false,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.wallet.delete({
      where: { id },
    });
  }
}
