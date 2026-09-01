import { Router } from 'express';
import * as controller from '../controllers/recurringTransactionController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.post('/run-due', asyncHandler(controller.runDue));
router.route('/').get(asyncHandler(controller.list)).post(asyncHandler(controller.create));
router.route('/:id').patch(asyncHandler(controller.update)).delete(asyncHandler(controller.remove));
export default router;
