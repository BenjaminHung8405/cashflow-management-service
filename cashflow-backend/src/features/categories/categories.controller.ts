import { AppError } from '@core/errors/AppError';
import { ApiResponse, AuthRequest } from '@/types/index';
import { NextFunction, Response } from 'express';
import { CategoriesUseCase } from './categories.usecase';

/**
 * Layer: Controller (HTTP req/res handling)
 * Feature: Categories
 */
export class CategoriesController {
  private useCase = new CategoriesUseCase();

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const categories = await this.useCase.getAllCategories(req.user.id);
      res.status(200).json({
        status: 'success',
        data: categories,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.createCategory(req.user.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const category = await this.useCase.getCategoryById(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        data: category,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const result = await this.useCase.updateCategory(req.user.id, req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      await this.useCase.deleteCategory(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
