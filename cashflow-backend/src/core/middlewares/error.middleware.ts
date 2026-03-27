import { AuthRequest } from '@/types/index';
import { NextFunction, Response } from 'express';

export const errorHandler = (
  err: Error & { statusCode?: number },
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details =
    process.env.NODE_ENV === 'production' ? undefined : err.stack;

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(details && { details }),
  });
};

export const asyncHandler = (
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
