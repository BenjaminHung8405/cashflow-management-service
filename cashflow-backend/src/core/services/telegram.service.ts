type TelegramSendResult = {
  ok: boolean;
  errorCode?: number;
  description?: string;
};

export class TelegramService {
  private static escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static async sendMessage(chatId: string, text: string): Promise<TelegramSendResult> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return {
        ok: false,
        description: 'TELEGRAM_BOT_TOKEN is missing',
      };
    }

    if (!chatId || chatId.trim().length === 0) {
      return {
        ok: false,
        description: 'telegram chat id is missing',
      };
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: this.escapeHtml(text),
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        return {
          ok: false,
          errorCode: data.error_code,
          description: data.description || response.statusText || 'Telegram API request failed',
        };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        description: error instanceof Error ? error.message : 'Unknown error while calling Telegram API',
      };
    }
  }
}
