import { ApiResponse, AuthRequest } from '@/types/index';
import { AppError } from '@core/errors/AppError';
import { NextFunction, Response } from 'express';
import { DashboardUseCase } from './dashboard.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Dashboard
 */
export class DashboardController {
  private useCase = new DashboardUseCase();

  private parseOptionalPositiveInteger(value: unknown, fieldName: 'month' | 'year'): number | undefined {
    if (value === undefined) return undefined;

    if (typeof value !== 'string') {
      throw new AppError(`${fieldName} must be a positive integer`, 400);
    }

    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) {
      throw new AppError(`${fieldName} must be a positive integer`, 400);
    }

    return Number(normalized);
  }

  async getStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const month = this.parseOptionalPositiveInteger(req.query.month, 'month');
      const year = this.parseOptionalPositiveInteger(req.query.year, 'year');

      const stats = await this.useCase.getMonthlyStatistics(req.user.id, month, year);

      res.status(200).json({
        status: 'success',
        message: 'Dashboard statistics fetched successfully',
        data: stats,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async getChart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const type = req.query.type as string | undefined;
      const month = this.parseOptionalPositiveInteger(req.query.month, 'month');
      const year = this.parseOptionalPositiveInteger(req.query.year, 'year');

      const result = await this.useCase.getChartData(req.user.id, type, month, year);

      res.status(200).json({
        status: 'success',
        message: 'Chart data fetched successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
