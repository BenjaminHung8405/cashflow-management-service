import { register } from '@features/auth/auth.controller';
import { Router } from 'express';

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post('/register', register);

export default router;