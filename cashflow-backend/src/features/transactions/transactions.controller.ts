import { AppError } from '@core/errors/AppError';
import { ApiResponse, AuthRequest, PaginationQuery } from '@types/index';
import { NextFunction, Response } from 'express';
import { TransactionsUseCase } from './transactions.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Transactions
 */
export class TransactionsController {
  private useCase = new TransactionsUseCase();

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const query: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const result = await this.useCase.getAllTransactions(req.user.id, query);
      res.status(200).json({
        status: 'success',
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
