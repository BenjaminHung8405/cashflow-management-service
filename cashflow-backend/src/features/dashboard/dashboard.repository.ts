import { prisma } from '@core/config/database';
import { TransactionType } from '@prisma/client';

/**
 * Layer: Repository (ONLY place for database queries)
 * Feature: Dashboard
 */
export class DashboardRepository {
  // 1. Tinh tong so du tat ca cac vi
  async getTotalBalance(userId: string): Promise<number> {
    const result = await prisma.wallet.aggregate({
      _sum: { balance: true },
      where: { userId },
    });

    return Number(result._sum.balance || 0);
  }

  // 2. Tinh tong Thu/Chi trong mot khoang thoi gian
  async getSumByTypeAndDate(
    userId: string,
    type: TransactionType,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
        transferGroupId: null,
      },
    });

    return Number(result._sum.amount || 0);
  }
}
