import { prisma } from '@core/config/database';
import { AppError } from '@core/errors/AppError';
import { TelegramService } from '@core/services/telegram.service';
import { formatAssistantOutputText } from '@core/utils/index';
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
    let roastMessage: string;

    if (stats.grandTotal === 0) {
      roastMessage = 'Ua thang nay rong tui hay gi ma chua thay tieu dong nao vay? Song bang niem tin a?';
    } else {
      const simplifiedData = {
        tong_tien_da_tieu: stats.grandTotal,
        chi_tiet_cac_khoan_dang_tiec_tien: stats.chartData.map((c) => ({
          ten_danh_muc: c.categoryName,
          so_tien: c.totalAmount,
        })),
      };

      const rawRoastMessage = await this.aiService.generateRoast(JSON.stringify(simplifiedData));
      roastMessage = formatAssistantOutputText(rawRoastMessage);
    }

    // Save or update report for today
    const today = new Date();
    const todayStr = today.toLocaleDateString('vi-VN'); // DD/MM/YYYY
    const reportTitle = `Đánh giá nhân phẩm ngày ${todayStr}`;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingReport = await prisma.report.findFirst({
      where: {
        userId,
        title: reportTitle,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (existingReport) {
      await prisma.report.update({
        where: { id: existingReport.id },
        data: {
          content: roastMessage,
          isRead: false,
          createdAt: new Date(), // Update timestamp to show it's refreshed
        },
      });
    } else {
      await prisma.report.create({
        data: {
          userId,
          title: reportTitle,
          content: roastMessage,
          isRead: false,
        },
      });
    }

    return {
      message: roastMessage,
      timestamp: new Date().toISOString(),
    };
  }

  async getReports(userId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    return await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markReportAsRead(userId: string, reportId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report || report.userId !== userId) {
      throw new AppError('Report not found', 404);
    }

    return await prisma.report.update({
      where: { id: reportId },
      data: { isRead: true },
    });
  }

  async sendTestRoastToTelegram(userId: string) {
    if (!userId) throw new AppError('Unauthorized', 401);

    const user = await getUserById(userId);
    if (!user.telegramChatId) {
      throw new AppError('telegramChatId is not linked. Please update profile first.', 400);
    }

    const roastResult = await this.getWeeklyRoast(userId);
    const message = [
      'Quan gia coc can da xuat hien!',
      '',
      roastResult.message,
      '',
      'Day la tin nhan test thu cong.',
    ].join('\n');

    const sendResult = await TelegramService.sendMessage(user.telegramChatId, message);
    if (!sendResult.ok) {
      throw new AppError(
        `Failed to send Telegram message: ${sendResult.description || 'Unknown Telegram error'}`,
        502,
        {
          telegramErrorCode: sendResult.errorCode || null,
          telegramDescription: sendResult.description || null,
        }
      );
    }

    return {
      sent: true,
      chatId: user.telegramChatId,
      timestamp: new Date().toISOString(),
    };
  }
}
