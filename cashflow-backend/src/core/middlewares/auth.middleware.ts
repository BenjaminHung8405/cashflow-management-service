import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest, JwtPayload } from '../../types/index';

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // 1. Lấy token từ header 'Authorization' (Định dạng chuẩn: "Bearer <token>")
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized: No token provided',
    });
    return;
  }

  // Cắt lấy phần chuỗi token nằm sau chữ "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // 2. Giải mã và xác thực token
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // 3. Gắn thông tin user vào request để các Controller phía sau sử dụng
    req.user = decoded;

    // 4. Cho phép đi qua cửa
    next();
  } catch (error: any) {
    // Token hết hạn hoặc bị sửa đổi
    const message =
      error.name === 'TokenExpiredError'
        ? 'Unauthorized: Token has expired'
        : 'Unauthorized: Invalid token';

    res.status(401).json({ status: 'error', message });
  }
};
