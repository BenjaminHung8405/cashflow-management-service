import { AuthRequest } from '@types/index';
import { NextFunction, Response } from 'express';

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // TODO: Implement token verification logic
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) throw new AppError('Unauthorized', 401);
    // const decoded = verifyToken(token);
    // req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // TODO: Implement optional token verification
    // Try to verify token, but don't fail if missing
    next();
  } catch (error) {
    next();
  }
};
