import { AppError } from '@core/errors/AppError';
import { ApiResponse, AuthRequest } from '@types/index';
import { NextFunction, Response } from 'express';
import { WalletsUseCase } from './wallets.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Wallets
 */
export class WalletsController {
  private useCase = new WalletsUseCase();

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const wallets = await this.useCase.getAllWallets(req.user.id);
      res.status(200).json({
        status: 'success',
        data: wallets,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.createWallet(req.user.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Wallet created successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const wallet = await this.useCase.getWalletById(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        data: wallet,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.updateWallet(req.user.id, req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Wallet updated successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      await this.useCase.deleteWallet(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Wallet deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
