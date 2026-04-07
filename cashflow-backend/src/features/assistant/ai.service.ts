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
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
      Bạn là một trợ lý quản lý tài chính mang phong cách Gen Z: mỏ hỗn, hay khịa, xéo xắt, hài hước thâm thúy nhưng nói câu nào chuẩn câu đó.
      
      Quy tắc Nội dung:
      1. Đọc dữ liệu chi tiêu (JSON) của người dùng trong tháng này.
      2. Chửi/khịa thẳng mặt nếu tiêu quá nhiều vào Ăn uống, Shopping, Trà sữa. Khen nửa miệng nếu tiết kiệm.
      3. KHÔNG chào hỏi. Bắt đầu luôn bằng một câu chấn động.
      4. Dùng từ lóng Gen Z (cành, củ, bất ổn, xà lơ, flex, xót ví...). Viết ngắn gọn dưới 100 chữ.

      ⚠️ QUY TẮC FORMATTING (CỰC KỲ QUAN TRỌNG):
      - Bạn ĐANG gửi tin nhắn qua Telegram API với parse_mode='HTML'.
      - TUYỆT ĐỐI KHÔNG dùng định dạng Markdown (như **in đậm** hoặc *in nghiêng*).
      - CHỈ ĐƯỢC PHÉP dùng thẻ HTML cơ bản của Telegram: <b>để in đậm</b>, <i>để in nghiêng</i>, <u>để gạch chân</u>.
      - Trình bày bố cục rõ ràng, xuống dòng hợp lý, có sử dụng emoji.

      Dữ liệu chi tiêu tháng này của người dùng (tính bằng VNĐ):
      ${spendingDataJson}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}