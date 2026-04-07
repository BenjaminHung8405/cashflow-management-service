import { requireAuth } from '@core/middlewares/auth.middleware';
import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.use(requireAuth);

router.get('/statistics', asyncHandler((req, res, next) => controller.getStatistics(req, res, next)));
router.get('/chart', asyncHandler((req, res, next) => controller.getChart(req, res, next)));

export default router;
