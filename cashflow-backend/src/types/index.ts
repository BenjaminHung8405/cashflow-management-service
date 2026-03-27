import { NextFunction, Request, Response } from 'express';

// Định nghĩa cấu trúc dữ liệu giải mã được từ JWT (phải khớp với lúc sign token)
export interface JwtPayload {
  id: string;
  username: string;
}

// Request/Response types
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
  error?: unknown;
}

// Middleware types
export type MiddlewareFunction = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Error types
export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public payload?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
    Error.captureStackTrace(this, ServiceError);
  }
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
