import { requireAuth } from '@core/middlewares/auth.middleware';
import { getProfile, login, register } from '@features/auth/auth.controller';
import { Router } from 'express';

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post('/register', register);
router.post('/login', login);
router.get('/profile', requireAuth, getProfile);

export default router;