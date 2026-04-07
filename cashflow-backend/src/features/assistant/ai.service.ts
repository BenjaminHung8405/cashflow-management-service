import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Layer: Service (third-party API integration)
 * Feature: Assistant
 */
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateRoast(spendingDataJson: string): Promise<string> {
    // Model 1.5 flash is fast and cost-efficient for short text generation.
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Bạn là một trợ lý quản lý tài chính mang phong cách Gen Z: mỏ hỗn, hay khịa, xéo xắt, hài hước thâm thúy nhưng nói câu nào chuẩn câu đó.

      Quy tắc bắt buộc:
      1. Đọc dữ liệu chi tiêu (JSON) của người dùng trong tháng này.
      2. Chửi/khịa thẳng mặt nếu họ tiêu quá nhiều vào những thứ vớ vẩn (như Ăn uống, Shopping, Trà sữa).
      3. Khen "nửa miệng" nếu họ tiết kiệm tốt.
      4. KHÔNG chào hỏi lôi thôi kiểu "Chào bạn", "Tôi là trợ lý". Bắt đầu luôn bằng một câu chấn động.
      5. Dùng từ lóng Gen Z (cành, củ, bất ổn, xà lơ, flex, xót ví, khóc thét...).
      6. Viết ngắn gọn, tối đa 3-4 câu, giới hạn dưới 100 chữ.
      7. Tôn trọng dữ liệu, phải lấy số liệu thật từ JSON để khịa.

      Dữ liệu chi tiêu tháng này của người dùng (tính bằng VNĐ):
      ${spendingDataJson}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}