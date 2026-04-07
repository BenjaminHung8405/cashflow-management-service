import { ApiResponse, AuthRequest } from '@/types/index';
import { AppError } from '@core/errors/AppError';
import { NextFunction, Response } from 'express';
import { BudgetsUseCase } from './budgets.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Budgets
 */
export class BudgetsController {
  private useCase = new BudgetsUseCase();

  private parseIntegerQuery(value: unknown, fieldName: string): number | undefined {
    if (value === undefined) return undefined;

    const parsed = Number.parseInt(value as string, 10);
    if (Number.isNaN(parsed)) {
      throw new AppError(`${fieldName} must be a valid integer`, 400);
    }

    return parsed;
  }

  async getProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const month = this.parseIntegerQuery(req.query.month, 'month') ?? new Date().getMonth() + 1;
      const year = this.parseIntegerQuery(req.query.year, 'year') ?? new Date().getFullYear();

      const budgets = await this.useCase.getBudgetsProgress(req.user.id, month, year);

      res.status(200).json({
        status: 'success',
        message: 'Budget progress fetched successfully',
        data: { budgets },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async set(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const budget = await this.useCase.setBudget(req.user.id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Budget saved successfully',
        data: { budget },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      await this.useCase.deleteBudget(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Budget deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
