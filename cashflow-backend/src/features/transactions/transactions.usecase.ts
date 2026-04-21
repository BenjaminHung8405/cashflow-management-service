import { PaginatedResponse, PaginationQuery } from '@/types/index';
import { prisma } from '@core/config/database';
import { AppError } from '@core/errors/AppError';
import { isValidUuid } from '@core/utils/uuid';
import { Transaction, TransactionType } from '@prisma/client';
import {
  CreateTransactionInput,
  TransactionsRepository,
  UpdateTransactionInput,
} from './transactions.repository';

/**
 * Layer: Use Case (pure business logic)
 * Feature: Transactions
 * Contains orchestration logic for complex operations
 */
export class TransactionsUseCase {
  private repository = new TransactionsRepository();

  async getRecentTransactions(userId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const limit = 5;
    return this.repository.findRecent(userId, limit);
  }

  async getTransactionsList(
    userId: string,
    page: number = 1,
    limit: number = 20,
    month?: number,
    year?: number
  ) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const { transactions, total } = await this.repository.findAllWithPagination(
      userId,
      skip,
      safeLimit,
      { month, year }
    );

    const totalPages = Math.ceil(total / safeLimit);

    return {
      transactions,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: safePage,
        itemsPerPage: safeLimit,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async getAllTransactions(
    userId: string,
    pagination: PaginationQuery
  ): Promise<PaginatedResponse<Transaction>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.repository.findByUserId(userId, { skip: offset, take: limit }),
      this.repository.countByUserId(userId),
    ]);

    return {
      items: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTransactionById(userId: string, transactionId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const transaction = await this.repository.findById(transactionId);

    if (!transaction || transaction.isDeleted) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.userId !== userId) {
      throw new AppError('Access denied. You do not own this transaction.', 403);
    }

    return transaction;
  }

  /**
   * Create transaction with ATOMIC operation to ensure consistency
   * Database Transaction: ensures both wallet balance and transaction are updated together
   */
  async createTransaction(userId: string, payload: unknown) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const { walletId, categoryId, amount, type, note, transactionDate } =
      payload as Record<string, unknown>;

    if (!walletId || !categoryId || !amount || !type || !transactionDate) {
      throw new AppError('Missing required fields', 400);
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
      throw new AppError('Invalid transaction type', 400);
    }

    const walletIdStr = String(walletId);
    const categoryIdStr = String(categoryId);

    if (!isValidUuid(walletIdStr)) {
      throw new AppError('Invalid walletId format', 400);
    }
    if (!isValidUuid(categoryIdStr)) {
      throw new AppError('Invalid categoryId format', 400);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletIdStr },
    });
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found or access denied', 404);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryIdStr },
    });
    if (!category || category.isDeleted) {
      throw new AppError('Category not found', 404);
    }

    if (category.userId !== null && category.userId !== userId) {
      throw new AppError('Category access denied', 403);
    }

    if (category.type !== type) {
      throw new AppError(`Category type mismatch. Expected ${category.type}`, 400);
    }

    const parsedDate = new Date(String(transactionDate));
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError('Invalid transactionDate', 400);
    }

    const createPayload: CreateTransactionInput = {
      userId,
      walletId: walletIdStr,
      categoryId: categoryIdStr,
      amount: parsedAmount,
      type,
      note: note ? String(note) : undefined,
      transactionDate: parsedDate,
    };

    return this.repository.createWithWalletUpdate(createPayload);
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    payload: unknown
  ) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const oldTransaction = await this.getTransactionById(userId, transactionId);
    const payloadData = payload as Record<string, unknown>;

    const nextType = payloadData.type ?? oldTransaction.type;
    if (nextType !== TransactionType.INCOME && nextType !== TransactionType.EXPENSE) {
      throw new AppError('Invalid transaction type', 400);
    }

    const nextAmount =
      payloadData.amount !== undefined
        ? Number(payloadData.amount)
        : Number(oldTransaction.amount);

    if (Number.isNaN(nextAmount) || nextAmount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    const nextWalletId = payloadData.walletId
      ? String(payloadData.walletId)
      : oldTransaction.walletId;
    const nextCategoryId = payloadData.categoryId
      ? String(payloadData.categoryId)
      : oldTransaction.categoryId;

    if (!isValidUuid(nextWalletId)) {
      throw new AppError('Invalid walletId format', 400);
    }
    if (!isValidUuid(nextCategoryId)) {
      throw new AppError('Invalid categoryId format', 400);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: nextWalletId },
    });
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found or access denied', 404);
    }

    const category = await prisma.category.findUnique({
      where: { id: nextCategoryId },
    });
    if (!category || category.isDeleted) {
      throw new AppError('Category not found', 404);
    }

    if (category.userId !== null && category.userId !== userId) {
      throw new AppError('Category access denied', 403);
    }

    if (category.type !== nextType) {
      throw new AppError('Invalid category type', 400);
    }

    const nextTransactionDate = payloadData.transactionDate
      ? new Date(String(payloadData.transactionDate))
      : oldTransaction.transactionDate;

    if (Number.isNaN(nextTransactionDate.getTime())) {
      throw new AppError('Invalid transactionDate', 400);
    }

    const newData: UpdateTransactionInput = {
      walletId: nextWalletId,
      categoryId: nextCategoryId,
      amount: nextAmount,
      type: nextType,
      note:
        payloadData.note !== undefined
          ? payloadData.note === null
            ? null
            : String(payloadData.note)
          : oldTransaction.note,
      transactionDate: nextTransactionDate,
    };

    return this.repository.updateWithBalanceUpdate(
      transactionId,
      {
        walletId: oldTransaction.walletId,
        amount: Number(oldTransaction.amount),
        type: oldTransaction.type,
      },
      newData
    );
  }

  async deleteTransaction(userId: string, transactionId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const transaction = await this.getTransactionById(userId, transactionId);

    return this.repository.deleteWithBalanceUpdate(transactionId, {
      walletId: transaction.walletId,
      amount: Number(transaction.amount),
      type: transaction.type,
    });
  }
}
