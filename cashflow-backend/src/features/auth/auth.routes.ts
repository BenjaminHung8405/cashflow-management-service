import { requireAuth } from '@core/middlewares/auth.middleware';
import {
    changePassword,
    getProfile,
    login,
    register,
    updateProfile,
} from '@features/auth/auth.controller';
import { Router } from 'express';

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post('/register', register);
router.post('/login', login);
router.get('/profile', requireAuth, getProfile);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/change-password', requireAuth, changePassword);

export default router;
