import { prisma } from '@core/config/database';
import { AppError } from '@core/errors/AppError';
import { Transaction, TransactionType } from '@prisma/client';
import { PaginatedResponse, PaginationQuery } from '@types/index';
import { TransactionsRepository } from './transactions.repository';

interface CreateTransactionInput {
  walletId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  note?: string;
  transactionDate: Date;
}

/**
 * Layer: Use Case (pure business logic)
 * Feature: Transactions
 * Contains orchestration logic for complex operations
 */
export class TransactionsUseCase {
  private repository = new TransactionsRepository();

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

  async getTransactionById(userId: string, transactionId: string): Promise<Transaction> {
    const transaction = await this.repository.findById(transactionId);

    if (!transaction || transaction.userId !== userId) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  }

  /**
   * Create transaction with ATOMIC operation to ensure consistency
   * Database Transaction: ensures both wallet balance and transaction are updated together
   */
  async createTransaction(userId: string, data: CreateTransactionInput): Promise<Transaction> {
    if (!data.walletId || !data.categoryId || !data.amount) {
      throw new AppError('Wallet ID, Category ID, and Amount are required', 400);
    }

    if (data.amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    // Use database transaction for atomic operation
    const transaction = await prisma.$transaction(async tx => {
      // Verify wallet exists and belongs to user
      const wallet = await tx.wallet.findUnique({
        where: { id: data.walletId },
      });

      if (!wallet || wallet.userId !== userId) {
        throw new AppError('Wallet not found', 404);
      }

      // Calculate new balance
      const amountDecimal = parseFloat(data.amount.toString());
      const newBalance =
        data.type === TransactionType.INCOME
          ? wallet.balance.toNumber() + amountDecimal
          : wallet.balance.toNumber() - amountDecimal;

      // Check balance for expenses
      if (data.type === TransactionType.EXPENSE && newBalance < 0) {
        throw new AppError('Insufficient balance', 400);
      }

      // Create transaction
      const createdTransaction = await tx.transaction.create({
        data: {
          userId,
          walletId: data.walletId,
          categoryId: data.categoryId,
          amount: amountDecimal,
          type: data.type,
          note: data.note,
          transactionDate: data.transactionDate,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: data.walletId },
        data: {
          balance: newBalance,
        },
      });

      return createdTransaction;
    });

    return transaction;
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    data: Partial<Transaction>
  ): Promise<Transaction> {
    const transaction = await this.getTransactionById(userId, transactionId);

    return this.repository.update(transactionId, {
      ...data,
      id: transaction.id,
      userId: transaction.userId,
      createdAt: transaction.createdAt,
      updatedAt: new Date(),
    });
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.getTransactionById(userId, transactionId);
    
    // Soft delete
    await this.repository.softDelete(transactionId);
  }
}
