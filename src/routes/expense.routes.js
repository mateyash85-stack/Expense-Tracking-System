import { Router } from 'express';
import { body } from 'express-validator';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
} from '../controllers/expense.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

const expenseValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
];

router.get('/summary', getSummary);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', expenseValidation, validate, createExpense);
router.put('/:id', expenseValidation, validate, updateExpense);
router.delete('/:id', deleteExpense);

export default router;
