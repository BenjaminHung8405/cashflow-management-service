import { ApiResponse, AuthRequest } from '@/types/index';
import { AppError } from '@core/errors/AppError';
import { NextFunction, Response } from 'express';
import { TransactionsUseCase } from './transactions.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Transactions
 */
export class TransactionsController {
  private useCase = new TransactionsUseCase();

  private parseIntegerQuery(value: unknown, fieldName: string): number | undefined {
    if (value === undefined) return undefined;

    const parsed = Number.parseInt(value as string, 10);
    if (Number.isNaN(parsed)) {
      throw new AppError(`${fieldName} must be a valid integer`, 400);
    }

    return parsed;
  }

  async getRecent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const transactions = await this.useCase.getRecentTransactions(req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Recent transactions fetched successfully',
        data: { transactions },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const page = this.parseIntegerQuery(req.query.page, 'page') ?? 1;
      const limit = this.parseIntegerQuery(req.query.limit, 'limit') ?? 20;
      const month = this.parseIntegerQuery(req.query.month, 'month');
      const year = this.parseIntegerQuery(req.query.year, 'year');

      if (page < 1) throw new AppError('page must be greater than or equal to 1', 400);
      if (limit < 1 || limit > 100) throw new AppError('limit must be between 1 and 100', 400);

      if ((month === undefined && year !== undefined) || (month !== undefined && year === undefined)) {
        throw new AppError('month and year must be provided together', 400);
      }

      if (month !== undefined && (month < 1 || month > 12)) {
        throw new AppError('month must be between 1 and 12', 400);
      }

      if (year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear + 1) {
          throw new AppError(`year must be between 1900 and ${currentYear + 1}`, 400);
        }
      }

      const result = await this.useCase.getTransactionsList(req.user.id, page, limit, month, year);

      res.status(200).json({
        status: 'success',
        message: 'Transactions fetched successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.createTransaction(req.user.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Transaction created successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const transaction = await this.useCase.getTransactionById(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        data: transaction,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.updateTransaction(req.user.id, req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Transaction updated successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      await this.useCase.deleteTransaction(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Transaction deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
