import { asyncHandler } from '@core/middlewares/error.middleware';
import { Router } from 'express';
import { CategoriesController } from './categories.controller';

const router = Router();
const controller = new CategoriesController();

router.get('/', asyncHandler((req, res, next) => controller.getAll(req, res, next)));
router.post('/', asyncHandler((req, res, next) => controller.create(req, res, next)));
router.get('/:id', asyncHandler((req, res, next) => controller.getById(req, res, next)));
router.patch('/:id', asyncHandler((req, res, next) => controller.update(req, res, next)));
router.delete('/:id', asyncHandler((req, res, next) => controller.delete(req, res, next)));

export default router;
