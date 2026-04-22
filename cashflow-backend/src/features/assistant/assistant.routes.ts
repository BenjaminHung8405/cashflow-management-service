import { requireAuth } from '@core/middlewares/auth.middleware';
import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { AssistantController } from './assistant.controller';

const router = Router();
const controller = new AssistantController();

router.use(requireAuth);

// Endpoint: GET /api/v1/assistant/roast
router.get('/roast', asyncHandler((req, res, next) => controller.getRoast(req, res, next)));

// Endpoint: GET /api/v1/assistant/reports
router.get('/reports', asyncHandler((req, res, next) => controller.getReports(req, res, next)));

// Endpoint: PATCH /api/v1/assistant/reports/:id/read
router.patch('/reports/:id/read', asyncHandler((req, res, next) => controller.markAsRead(req, res, next)));

export default router;
