import { requireAuth } from '@core/middlewares/auth.middleware';
import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { WalletsController } from './wallets.controller';

const router = Router();
const controller = new WalletsController();

router.use(requireAuth);

/**
 * GET /api/v1/wallets
 * Get all wallets for user
 */
router.get('/', asyncHandler((req, res, next) => controller.getAll(req, res, next)));

/**
 * POST /api/v1/wallets
 * Create new wallet
 */
router.post('/', asyncHandler((req, res, next) => controller.create(req, res, next)));

/**
 * GET /api/v1/wallets/:id
 * Get wallet by ID
 */
router.get('/:id', asyncHandler((req, res, next) => controller.getById(req, res, next)));

/**
 * PATCH /api/v1/wallets/:id
 * Update wallet
 */
router.patch('/:id', asyncHandler((req, res, next) => controller.update(req, res, next)));

/**
 * DELETE /api/v1/wallets/:id
 * Delete wallet
 */
router.delete('/:id', asyncHandler((req, res, next) => controller.delete(req, res, next)));

export default router;
