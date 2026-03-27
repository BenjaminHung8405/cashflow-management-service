import { AppError } from '@core/errors/AppError';
import { Category, TransactionType } from '@prisma/client';
import { CategoriesRepository, UpdateCategoryInput } from './categories.repository';

type CreateCategoryPayload = {
  name: string;
  type: TransactionType;
  icon?: string | null;
};

/**
 * Layer: Use Case (pure business logic)
 * Feature: Categories
 */
export class CategoriesUseCase {
  private repository = new CategoriesRepository();

  async getAllCategories(userId: string): Promise<Category[]> {
    if (!userId) throw new AppError('Unauthorized', 401);
    return this.repository.findAllVisibleForUser(userId);
  }

  async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    if (!userId) throw new AppError('Unauthorized', 401);

    const category = await this.repository.findById(categoryId);

    if (!category || category.isDeleted) {
      throw new AppError('Category not found', 404);
    }

    const visibleToUser = category.userId === null || category.userId === userId;
    if (!visibleToUser) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async createCategory(userId: string, data: CreateCategoryPayload): Promise<Category> {
    if (!userId) throw new AppError('Unauthorized', 401);

    const name = data.name?.trim();
    if (!name || !data.type) {
      throw new AppError('Category name and type are required', 400);
    }

    const duplicate = await this.repository.findActiveCustomByNameAndType(userId, name, data.type);
    if (duplicate) {
      throw new AppError('Category already exists', 409);
    }

    return this.repository.create({
      userId,
      name,
      type: data.type,
      icon: data.icon ?? null,
    });
  }

  async updateCategory(userId: string, categoryId: string, data: UpdateCategoryInput): Promise<Category> {
    const category = await this.requireOwnCustomCategory(userId, categoryId);

    const payload: UpdateCategoryInput = {
      name: data.name?.trim(),
      type: data.type,
      icon: data.icon,
    };

    if (payload.name === '') {
      throw new AppError('Category name cannot be empty', 400);
    }

    if (payload.name || payload.type) {
      const nextName = payload.name ?? category.name;
      const nextType = payload.type ?? category.type;

      const duplicate = await this.repository.findActiveCustomByNameAndType(
        userId,
        nextName,
        nextType
      );
      if (duplicate && duplicate.id !== categoryId) {
        throw new AppError('Category already exists', 409);
      }
    }

    return this.repository.update(categoryId, payload);
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    await this.requireOwnCustomCategory(userId, categoryId);
    await this.repository.softDelete(categoryId);
  }

  private async requireOwnCustomCategory(userId: string, categoryId: string): Promise<Category> {
    if (!userId) throw new AppError('Unauthorized', 401);

    const category = await this.repository.findById(categoryId);
    if (!category || category.isDeleted) {
      throw new AppError('Category not found', 404);
    }

    if (category.userId === null) {
      throw new AppError('System category cannot be modified', 403);
    }

    if (category.userId !== userId) {
      throw new AppError('You can only modify your own categories', 403);
    }

    return category;
  }
}
