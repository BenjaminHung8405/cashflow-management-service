import { AppError } from '@core/errors/AppError';
import {
    changePassword as changePasswordUseCase,
    getUserById,
    loginUser,
    registerUser,
} from '@features/auth/auth.usecase';
import { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../../types/index';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Controller chỉ làm nhiệm vụ trích xuất dữ liệu từ body
    const { username, email, password } = req.body;

    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    // Đẩy data xuống UseCase xử lý
    const user = await registerUser({ username, email, password });

    // Trả về kết quả
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error) {
    // Nếu UseCase quăng lỗi (ví dụ: Trùng username), đẩy sang Error Middleware xử lý
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    const result = await loginUser({ username, password });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    // Trả về lỗi theo chuẩn AppError từ UseCase / Middleware
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    // Nhờ middleware 'requireAuth', ta chắc chắn req.user đã tồn tại ở bước này
    const userId = req.user.id;

    const user = await getUserById(userId);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    await changePasswordUseCase(userId, { oldPassword, newPassword });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
