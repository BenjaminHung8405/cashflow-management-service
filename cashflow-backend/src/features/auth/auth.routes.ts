import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler((req, res, next) => authController.register(req, res, next)));

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', asyncHandler((req, res, next) => authController.login(req, res, next)));

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 */
router.get('/profile', asyncHandler((req, res, next) => authController.getProfile(req, res, next)));

export default router;
