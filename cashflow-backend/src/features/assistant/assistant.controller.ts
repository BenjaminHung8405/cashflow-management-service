import type { ApiResponse, AuthRequest } from '@/types/index';
import { AppError } from '@core/errors/AppError';
import { NextFunction, Response } from 'express';
import { AssistantUseCase } from './assistant.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Assistant
 */
export class AssistantController {
  private useCase = new AssistantUseCase();

  async getRoast(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.getWeeklyRoast(req.user!.id);

      res.status(200).json({
        status: 'success',
        message: 'Assistant roast generated successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async sendTestTelegram(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.sendTestRoastToTelegram(req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Test Telegram message sent successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
