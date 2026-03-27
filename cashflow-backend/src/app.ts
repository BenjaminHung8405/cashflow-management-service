import { errorHandler } from '@core/middlewares/error.middleware';
import authRoutes from '@features/auth/auth.routes';
import { ApiResponse, AuthRequest } from '@/types/index';
import cors from 'cors';
import express, { Express, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app: Express = express();

// ================= Middlewares =================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ================= Routes =================

// Health check
app.get('/health', (req: AuthRequest, res: Response) => {
  const response: ApiResponse = {
    status: 'success',
    message: 'Cashflow API is running smoothly!',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };
  res.status(200).json(response);
});

// TODO: Mount feature routes
// import walletRoutes from '@features/wallets/wallets.routes';
// import categoryRoutes from '@features/categories/categories.routes';
// import transactionRoutes from '@features/transactions/transactions.routes';
//
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/wallets', walletRoutes);
// app.use('/api/v1/categories', categoryRoutes);
// app.use('/api/v1/transactions', transactionRoutes);

// 404 handler
app.use((req: AuthRequest, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// ================= Error Handling =================
app.use(errorHandler);

export default app;
