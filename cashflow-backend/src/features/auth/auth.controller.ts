import { getUserById, loginUser, registerUser } from '@features/auth/auth.usecase';
import { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../../types/index';

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

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ status: 'error', message: 'Username and password are required' });
      return;
    }

    const result = await loginUser({ username, password });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    // Trả về 401 Unauthorized nếu sai thông tin
    res.status(401).json({ status: 'error', message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Nhờ middleware 'requireAuth', ta chắc chắn req.user đã tồn tại ở bước này
    const userId = req.user?.id;

    const user = await getUserById(userId!);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};