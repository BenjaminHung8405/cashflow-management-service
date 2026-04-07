import { AppError } from '@core/errors/AppError';
import { CategoriesUseCase } from '@features/categories/categories.usecase';
import { Category, TransactionType } from '@prisma/client';
import { BudgetsRepository } from './budgets.repository';

type SetBudgetPayload = {
  categoryId?: string;
  amount?: number;
  month?: number;
  year?: number;
};

type BudgetProgress = {
  id: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
  };
  month: number;
  year: number;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  isExceeded: boolean;
};

/**
 * Layer: Use Case (pure business logic)
 * Feature: Budgets
 */
export class BudgetsUseCase {
  private repository = new BudgetsRepository();
  private categoriesUseCase = new CategoriesUseCase();

  async getBudgetsProgress(userId: string, month: number, year: number): Promise<BudgetProgress[]> {
    this.validateUser(userId);
    this.validateMonthYear(month, year);

    const { startDate, endDate } = this.getMonthRange(month, year);
    const budgets = await this.repository.findByMonthAndYear(userId, startDate, endDate);

    if (budgets.length === 0) return [];

    return Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.repository.getSpentAmount(
          userId,
          budget.categoryId,
          startDate,
          endDate
        );

        const limit = Number(budget.amountLimit);
        const remaining = limit - spent;
        const rawPercentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          id: budget.id,
          category: budget.category,
          month,
          year,
          limitAmount: limit,
          spentAmount: spent,
          remainingAmount: remaining > 0 ? remaining : 0,
          percentage: Number(Math.min(rawPercentage, 100).toFixed(1)),
          isExceeded: spent > limit,
        };
      })
    );
  }

  async setBudget(userId: string, payload: unknown) {
    this.validateUser(userId);

    const { categoryId, amount, month, year } = this.parseSetBudgetPayload(payload);
    const category = (await this.categoriesUseCase.getCategoryById(userId, categoryId)) as Category;

    if (category.type !== TransactionType.EXPENSE) {
      throw new AppError('Budgets can only be set for EXPENSE categories', 400);
    }

    const { startDate, endDate } = this.getMonthRange(month, year);
    const existing = await this.repository.findSpecificBudget(
      userId,
      categoryId,
      startDate,
      endDate
    );

    if (existing) {
      return this.repository.update(existing.id, amount);
    }

    return this.repository.create({
      userId,
      categoryId,
      amountLimit: amount,
      startDate,
      endDate,
    });
  }

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    this.validateUser(userId);

    const budget = await this.repository.findById(budgetId);
    if (!budget || budget.userId !== userId) {
      throw new AppError('Budget not found or access denied', 404);
    }

    await this.repository.delete(budgetId);
  }

  private validateUser(userId: string): void {
    if (!userId) throw new AppError('Unauthorized', 401);
  }

  private parseSetBudgetPayload(payload: unknown): {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
  } {
    const data = payload as SetBudgetPayload;

    if (!data?.categoryId || data.amount === undefined || !data.month || !data.year) {
      throw new AppError('Missing required fields', 400);
    }

    const amount = Number(data.amount);
    const month = Number(data.month);
    const year = Number(data.year);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError('Budget amount must be greater than 0', 400);
    }

    this.validateMonthYear(month, year);

    return {
      categoryId: String(data.categoryId),
      amount,
      month,
      year,
    };
  }

  private validateMonthYear(month: number, year: number): void {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError('month must be between 1 and 12', 400);
    }

    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
      throw new AppError(`year must be between 1900 and ${currentYear + 1}`, 400);
    }
  }

  private getMonthRange(month: number, year: number): { startDate: Date; endDate: Date } {
    return {
      startDate: new Date(year, month - 1, 1, 0, 0, 0, 0),
      endDate: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }
}
