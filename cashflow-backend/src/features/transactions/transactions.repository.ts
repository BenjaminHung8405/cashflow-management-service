import { prisma } from '@core/config/database';
import { Prisma, Transaction, TransactionType } from '@prisma/client';

interface FindOptions {
  skip?: number;
  take?: number;
}

/**
 * Layer: Repository (ONLY place for database queries)
 * Feature: Transactions
 * Handles all database operations with indexes for performance
 */
export class TransactionsRepository {
  async findRecent(
    userId: string,
    limit: number
  ): Promise<Prisma.TransactionGetPayload<{
    include: {
      category: { select: { id: true; name: true; icon: true; type: true } };
      wallet: { select: { id: true; name: true; icon: true } };
    };
  }>[]> {
    return prisma.transaction.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: [
        { transactionDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, icon: true, type: true },
        },
        wallet: {
          select: { id: true, name: true, icon: true },
        },
      },
    });
  }

  async findAllWithPagination(
    userId: string,
    skip: number,
    take: number,
    filters: { month?: number; year?: number }
  ) {
    const whereClause: Prisma.TransactionWhereInput = {
      userId,
      isDeleted: false,
    };

    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);

      whereClause.transactionDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          category: {
            select: { id: true, name: true, icon: true, type: true },
          },
          wallet: {
            select: { id: true, name: true, icon: true },
          },
        },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return { transactions, total };
  }

  async findByUserId(userId: string, options: FindOptions): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: { transactionDate: 'desc' },
      skip: options.skip || 0,
      take: options.take || 10,
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.transaction.count({
      where: {
        userId,
        isDeleted: false,
      },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  async create(data: {
    userId: string;
    walletId: string;
    categoryId: string;
    amount: number;
    type: TransactionType;
    note?: string;
    transactionDate: Date;
  }): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.transaction.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({
      where: { id },
    });
  }
}
