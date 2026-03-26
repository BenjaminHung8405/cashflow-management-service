import { prisma } from '@core/config/database';
import { Wallet, WalletType } from '@prisma/client';

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

  async create(data: {
    userId: string;
    name: string;
    walletType: WalletType;
    icon?: string | null;
    creditLimit?: number | null;
  }): Promise<Wallet> {
    return prisma.wallet.create({
      data: {
        userId: data.userId,
        name: data.name,
        walletType: data.walletType,
        icon: data.icon,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit.toString()) : 0,
      },
    });
  }

  async update(id: string, data: Partial<Wallet>): Promise<Wallet> {
    return prisma.wallet.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.wallet.delete({
      where: { id },
    });
  }
}
