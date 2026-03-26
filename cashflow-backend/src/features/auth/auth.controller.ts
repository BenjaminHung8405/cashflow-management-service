import { AppError } from '@core/errors/AppError';
import { ApiResponse, AuthRequest } from '@types/index';
import { NextFunction, Response } from 'express';
import { AuthUseCase } from './auth.usecase';

export class AuthController {
  private useCase: AuthUseCase = new AuthUseCase();

  /**
   * Layer: Controller (HTTP req/res handling)
   * Feature: Auth (registration)
   */
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !password) {
        throw new AppError('Username and password are required', 400);
      }

      const result = await this.useCase.register({ username, email, password });

      const response: ApiResponse = {
        status: 'success',
        message: 'User registered successfully',
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Layer: Controller (HTTP req/res handling)
   * Feature: Auth (login)
   */
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('Username and password are required', 400);
      }

      const result = await this.useCase.login({ username, password });

      const response: ApiResponse = {
        status: 'success',
        message: 'Login successful',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Layer: Controller (HTTP req/res handling)
   * Feature: Auth (get profile)
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await this.useCase.getProfile(req.user.id);

      const response: ApiResponse = {
        status: 'success',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
