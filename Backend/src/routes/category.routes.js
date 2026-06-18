import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', getCategories);

router.post(
  '/',
  [body('name').notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);

router.put(
  '/:id',
  [body('name').optional().notEmpty().withMessage('Category name cannot be empty')],
  validate,
  updateCategory
);

router.delete('/:id', deleteCategory);

export default router;
