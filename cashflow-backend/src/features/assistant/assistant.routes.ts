import { requireAuth } from '@core/middlewares/auth.middleware';
import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { AssistantController } from './assistant.controller';

const router = Router();
const controller = new AssistantController();

router.use(requireAuth);

// Endpoint: GET /api/v1/assistant/roast
router.get('/roast', asyncHandler((req, res, next) => controller.getRoast(req, res, next)));

// Endpoint: POST /api/v1/assistant/test-telegram
router.post('/test-telegram', asyncHandler((req, res, next) => controller.sendTestTelegram(req, res, next)));

export default router;
