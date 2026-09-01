import { Router } from 'express';
import * as controller from '../controllers/dashboardController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.get('/summary', asyncHandler(controller.summary));
router.get('/monthly', asyncHandler(controller.monthly));
router.get('/categories', asyncHandler(controller.categories));
router.get('/budgets', asyncHandler(controller.budgets));
router.get('/alerts', asyncHandler(controller.alerts));
export default router;
