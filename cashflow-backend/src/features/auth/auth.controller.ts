import { NextFunction, Request, Response } from 'express';
import { registerUser } from './auth.usecase';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Controller chỉ làm nhiệm vụ trích xuất dữ liệu từ body
    const { username, email, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ status: 'error', message: 'Username and password are required' });
      return;
    }

    // Đẩy data xuống UseCase xử lý
    const user = await registerUser({ username, email, password });

    // Trả về kết quả
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error: any) {
    // Nếu UseCase quăng lỗi (ví dụ: Trùng username), đẩy sang Error Middleware xử lý
    res.status(400).json({ status: 'error', message: error.message });
  }
};