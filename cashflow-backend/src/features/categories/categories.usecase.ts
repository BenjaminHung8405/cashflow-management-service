import { AppError } from '@core/errors/AppError';
import { Category, TransactionType } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';

/**
 * Layer: Use Case (pure business logic)
 * Feature: Categories
 */
export class CategoriesUseCase {
  private repository = new CategoriesRepository();

  async getAllCategories(userId: string): Promise<Category[]> {
    return this.repository.findAllByUserId(userId);
  }

  async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    const category = await this.repository.findById(categoryId);

    if (!category || (category.userId !== userId && category.userId !== null)) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async createCategory(
    userId: string,
    data: {
      name: string;
      type: TransactionType;
      icon?: string;
    }
  ): Promise<Category> {
    if (!data.name || !data.type) {
      throw new AppError('Category name and type are required', 400);
    }

    return this.repository.create({
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
    });
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    data: Partial<Category>
  ): Promise<Category> {
    const category = await this.getCategoryById(userId, categoryId);

    return this.repository.update(categoryId, {
      ...data,
      id: category.id,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: new Date(),
    });
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.getCategoryById(userId, categoryId);
    await this.repository.delete(categoryId);
  }
}
