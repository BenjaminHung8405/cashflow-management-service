import prisma from '@core/config/database';
import { TelegramService } from '@core/services/telegram.service';
import { AssistantUseCase } from '@features/assistant/assistant.usecase';
import cron from 'node-cron';

export const startCronJobs = (): void => {
  const assistantUseCase = new AssistantUseCase();

  // Run at 20:00 every Sunday (Vietnam timezone).
  cron.schedule(
    '0 20 * * 0',
    async () => {
      console.log('[weekly-roast-job] Start');

      try {
        const users = await prisma.user.findMany({
          where: { telegramChatId: { not: null } },
          select: {
            id: true,
            username: true,
            telegramChatId: true,
          },
        });

        for (const user of users) {
          try {
            const roastResult = await assistantUseCase.getWeeklyRoast(user.id);

            const message = [
              '<b>Quan gia coc can da xuat hien!</b>',
              '',
              roastResult.message,
              '',
              '<i>Hen gap lai tuan sau. Lo ma lam an di!</i>',
            ].join('\n');

            if (user.telegramChatId) {
              await TelegramService.sendMessage(user.telegramChatId, message);
            }

            // Avoid sending too fast to external APIs.
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (error) {
            console.error(`[weekly-roast-job] Failed for user ${user.username}:`, error);
          }
        }

        console.log('[weekly-roast-job] Completed');
      } catch (error) {
        console.error('[weekly-roast-job] Unexpected error:', error);
      }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh',
    }
  );
};
