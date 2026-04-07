import { prisma } from '@core/config/database';
import { Budget, Category, TransactionType } from '@prisma/client';

type BudgetWithCategory = Budget & {
  category: Pick<Category, 'id' | 'name' | 'icon'>;
};

type CreateBudgetInput = {
  userId: string;
  categoryId: string;
  amountLimit: number;
  startDate: Date;
  endDate: Date;
};

/**
 * Layer: Repository (ONLY place for database queries)
 * Feature: Budgets
 */
export class BudgetsRepository {
  async findByMonthAndYear(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetWithCategory[]> {
    return prisma.budget.findMany({
      where: {
        userId,
        startDate: { gte: startDate, lte: endDate },
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy: [{ category: { name: 'asc' } }],
    });
  }

  async findSpecificBudget(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Budget | null> {
    return prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        startDate: { gte: startDate, lte: endDate },
      },
    });
  }

  async findById(id: string): Promise<Budget | null> {
    return prisma.budget.findUnique({ where: { id } });
  }

  async create(data: CreateBudgetInput): Promise<Budget> {
    return prisma.budget.create({ data });
  }

  async update(id: string, amountLimit: number): Promise<Budget> {
    return prisma.budget.update({
      where: { id },
      data: { amountLimit },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.budget.delete({ where: { id } });
  }

  async getSpentAmount(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        categoryId,
        type: TransactionType.EXPENSE,
        isDeleted: false,
        transactionDate: { gte: startDate, lte: endDate },
      },
    });

    return Number(result._sum.amount || 0);
  }
}
