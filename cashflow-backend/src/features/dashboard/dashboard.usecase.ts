import { AppError } from '@core/errors/AppError';
import { TransactionType } from '@prisma/client';
import { DashboardRepository } from './dashboard.repository';

/**
 * Layer: Use Case (pure business logic)
 * Feature: Dashboard
 */
export class DashboardUseCase {
  private repository = new DashboardRepository();

  async getMonthlyStatistics(userId: string, month?: number, year?: number) {
    if (!userId) throw new AppError('Unauthorized', 401);
    if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
      throw new AppError('Month must be an integer between 1 and 12', 400);
    }

    if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
      throw new AppError('Year must be between 1900 and 2100', 400);
    }

    // Neu user khong truyen thang/nam, mac dinh lay thang hien tai
    const currentDate = new Date();
    const targetMonth = month !== undefined ? month - 1 : currentDate.getMonth();
    const targetYear = year !== undefined ? year : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const [totalBalance, totalIncome, totalExpense] = await Promise.all([
      this.repository.getTotalBalance(userId),
      this.repository.getSumByTypeAndDate(userId, 'INCOME', startDate, endDate),
      this.repository.getSumByTypeAndDate(userId, 'EXPENSE', startDate, endDate),
    ]);

    return {
      period: {
        month: targetMonth + 1,
        year: targetYear,
      },
      totalBalance,
      totalIncome,
      totalExpense,
    };
  }

  async getChartData(userId: string, typeParam?: string, month?: number, year?: number) {
    if (!userId) throw new AppError('Unauthorized', 401);
    if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
      throw new AppError('Month must be an integer between 1 and 12', 400);
    }

    if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
      throw new AppError('Year must be between 1900 and 2100', 400);
    }

    const type: TransactionType = typeParam === 'INCOME' ? 'INCOME' : 'EXPENSE';

    const currentDate = new Date();
    const targetMonth = month !== undefined ? month - 1 : currentDate.getMonth();
    const targetYear = year !== undefined ? year : currentDate.getFullYear();
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const rawData = await this.repository.getGroupedTransactions(userId, type, startDate, endDate);
    const grandTotal = rawData.reduce((sum, item) => sum + item.totalAmount, 0);

    const chartData = rawData.map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? Number(((item.totalAmount / grandTotal) * 100).toFixed(2)) : 0,
    }));

    return {
      period: { month: targetMonth + 1, year: targetYear },
      type,
      grandTotal,
      chartData,
    };
  }
}
