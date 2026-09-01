import { Router } from 'express';
import * as controller from '../controllers/budgetController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.route('/').get(asyncHandler(controller.list)).post(asyncHandler(controller.create));
router.route('/:id').patch(asyncHandler(controller.update)).delete(asyncHandler(controller.remove));
export default router;
