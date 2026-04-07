import { requireAuth } from '@core/middlewares/auth.middleware';
import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { BudgetsController } from './budgets.controller';

const router = Router();
const controller = new BudgetsController();

router.use(requireAuth);

router.get('/progress', asyncHandler((req, res, next) => controller.getProgress(req, res, next)));
router.post('/', asyncHandler((req, res, next) => controller.set(req, res, next)));
router.delete('/:id', asyncHandler((req, res, next) => controller.delete(req, res, next)));

export default router;
