import { prisma } from '@core/config/database';
import { Category, TransactionType } from '@prisma/client';

/**
 * Layer: Repository (ONLY place for database queries)
 * Feature: Categories
 */
export class CategoriesRepository {
  async findAllByUserId(userId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }], // Include system categories
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    type: TransactionType;
    icon?: string | null;
  }): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
