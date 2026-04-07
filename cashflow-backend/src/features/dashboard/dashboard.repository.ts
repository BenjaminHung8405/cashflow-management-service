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

  async getGroupedTransactions(
    userId: string,
    type: TransactionType,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ categoryId: string; categoryName: string; icon: string | null; totalAmount: number }>> {
    const groupedData = await prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: {
        userId,
        type,
        transactionDate: { gte: startDate, lte: endDate },
        isDeleted: false,
        transferGroupId: null,
      },
      orderBy: {
        _sum: { amount: 'desc' },
      },
    });

    if (groupedData.length === 0) return [];

    const categoryIds = groupedData.map((group) => group.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true },
    });

    return groupedData.map((group) => {
      const category = categories.find((item) => item.id === group.categoryId);

      return {
        categoryId: group.categoryId,
        categoryName: category?.name || 'Unknown',
        icon: category?.icon || null,
        totalAmount: Number(group._sum.amount || 0),
      };
    });
  }
}
