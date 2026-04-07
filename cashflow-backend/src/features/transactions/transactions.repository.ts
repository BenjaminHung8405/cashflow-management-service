import { prisma } from '@core/config/database';
import { Prisma, Transaction, TransactionType } from '@prisma/client';

export type CreateTransactionInput = {
  userId: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  note?: string;
  transactionDate: Date;
};

export type UpdateTransactionInput = {
  walletId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  note?: string | null;
  transactionDate: Date;
};

type BalanceMutationSnapshot = {
  walletId: string;
  amount: number;
  type: TransactionType;
};

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

  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
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

  async createWithWalletUpdate(data: CreateTransactionInput) {
    return prisma.$transaction(async tx => {
      const newTransaction = await tx.transaction.create({
        data: {
          userId: data.userId,
          walletId: data.walletId,
          categoryId: data.categoryId,
          amount: data.amount,
          type: data.type,
          note: data.note,
          transactionDate: data.transactionDate,
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, type: true },
          },
          wallet: {
            select: { id: true, name: true },
          },
        },
      });

      const isIncome = data.type === TransactionType.INCOME;

      await tx.wallet.update({
        where: { id: data.walletId },
        data: {
          balance: isIncome
            ? { increment: data.amount }
            : { decrement: data.amount },
        },
      });

      return newTransaction;
    });
  }

  async updateWithBalanceUpdate(
    id: string,
    oldData: BalanceMutationSnapshot,
    newData: UpdateTransactionInput
  ) {
    return prisma.$transaction(async tx => {
      const revertMultiplier = oldData.type === TransactionType.INCOME ? -1 : 1;
      await tx.wallet.update({
        where: { id: oldData.walletId },
        data: {
          balance: {
            increment: oldData.amount * revertMultiplier,
          },
        },
      });

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          walletId: newData.walletId,
          categoryId: newData.categoryId,
          amount: newData.amount,
          type: newData.type,
          note: newData.note,
          transactionDate: newData.transactionDate,
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, type: true },
          },
          wallet: {
            select: { id: true, name: true, icon: true },
          },
        },
      });

      const applyMultiplier = newData.type === TransactionType.INCOME ? 1 : -1;
      await tx.wallet.update({
        where: { id: newData.walletId },
        data: {
          balance: {
            increment: newData.amount * applyMultiplier,
          },
        },
      });

      return updatedTransaction;
    });
  }

  async deleteWithBalanceUpdate(id: string, transactionData: BalanceMutationSnapshot) {
    return prisma.$transaction(async tx => {
      const revertMultiplier = transactionData.type === TransactionType.INCOME ? -1 : 1;

      await tx.wallet.update({
        where: { id: transactionData.walletId },
        data: {
          balance: {
            increment: transactionData.amount * revertMultiplier,
          },
        },
      });

      return tx.transaction.update({
        where: { id },
        data: { isDeleted: true },
      });
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
