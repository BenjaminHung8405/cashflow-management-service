import { AppError } from '@core/errors/AppError';
import { TelegramService } from '@core/services/telegram.service';
import { getUserById } from '@features/auth/auth.usecase';
import { DashboardUseCase } from '@features/dashboard/dashboard.usecase';
import { AiService } from './ai.service';

/**
 * Layer: Use Case (pure business logic)
 * Feature: Assistant
 */
export class AssistantUseCase {
  private aiService = new AiService();
  private dashboardUseCase = new DashboardUseCase();

  async getWeeklyRoast(userId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    // Reuse dashboard chart data of current month for EXPENSE transactions.
    const stats = await this.dashboardUseCase.getChartData(userId, 'EXPENSE');

    if (stats.grandTotal === 0) {
      return {
        message: 'Ua thang nay rong tui hay gi ma chua thay tieu dong nao vay? Song bang niem tin a?',
        timestamp: new Date().toISOString(),
      };
    }

    const simplifiedData = {
      tong_tien_da_tieu: stats.grandTotal,
      chi_tiet_cac_khoan_dang_tiec_tien: stats.chartData.map((c) => ({
        ten_danh_muc: c.categoryName,
        so_tien: c.totalAmount,
      })),
    };

    const roastMessage = await this.aiService.generateRoast(JSON.stringify(simplifiedData));

    return {
      message: roastMessage,
      timestamp: new Date().toISOString(),
    };
  }

  async sendTestRoastToTelegram(userId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const user = await getUserById(userId);
    if (!user.telegramChatId) {
      throw new AppError('telegramChatId is not linked. Please update profile first.', 400);
    }

    const roastResult = await this.getWeeklyRoast(userId);
    const message = [
      '<b>Quan gia coc can da xuat hien!</b>',
      '',
      roastResult.message,
      '',
      '<i>Day la tin nhan test thu cong.</i>',
    ].join('\n');

    const sent = await TelegramService.sendMessage(user.telegramChatId, message);
    if (!sent) {
      throw new AppError('Failed to send Telegram message', 502);
    }

    return {
      sent: true,
      chatId: user.telegramChatId,
      timestamp: new Date().toISOString(),
    };
  }
}
