import { prisma } from '@core/config/database';
import { Category, TransactionType } from '@prisma/client';

export type CreateCategoryInput = {
  userId: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
};

export type UpdateCategoryInput = {
  name?: string;
  type?: TransactionType;
  icon?: string | null;
};

/**
 * Layer: Repository (ONLY place for database queries)
 * Feature: Categories
 */
export class CategoriesRepository {
  async findAllVisibleForUser(userId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        isDeleted: false,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  async findActiveCustomByNameAndType(
    userId: string,
    name: string,
    type: TransactionType
  ): Promise<Category | null> {
    return prisma.category.findFirst({
      where: {
        userId,
        name,
        type,
        isDeleted: false,
      },
    });
  }

  async create(data: CreateCategoryInput): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
