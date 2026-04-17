import { ApiResponse, AuthRequest } from "@/types/index";
import { errorHandler } from "@core/middlewares/error.middleware";
import assistantRoutes from "@features/assistant/assistant.routes";
import authRoutes from "@features/auth/auth.routes";
import budgetRoutes from "@features/budgets/budgets.routes";
import categoryRoutes from "@features/categories/categories.routes";
import dashboardRoutes from "@features/dashboard/dashboard.routes";
import transactionRoutes from "@features/transactions/transactions.routes";
import walletRoutes from "@features/wallets/wallets.routes";
import cors from "cors";
import express, { Express, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { startCronJobs } from "./jobs/weekly-roast.job";

const app: Express = express();

// ================= Middlewares =================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ================= Routes =================

// Health check
app.get("/health", (req: AuthRequest, res: Response) => {
  const response: ApiResponse = {
    status: "success",
    message: "Cashflow API is running smoothly!",
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };
  res.status(200).json(response);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallets", walletRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/assistant", assistantRoutes);

// 404 handler
app.use((req: AuthRequest, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// ================= Error Handling =================
app.use(errorHandler);

// Start scheduled background jobs.
startCronJobs();

export default app;
