import { Router } from 'express';
import * as controller from '../controllers/transactionController.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as csvController from '../controllers/csvController.js';
import { csvUpload } from '../middleware/csvUpload.js';

const router = Router();
router.get('/export', asyncHandler(csvController.exportTransactions));
router.post('/import/preview', csvUpload, asyncHandler(csvController.preview));
router.post('/import/confirm', asyncHandler(csvController.confirm));
router.route('/').get(asyncHandler(controller.list)).post(asyncHandler(controller.create));
router.route('/:id').get(asyncHandler(controller.getById)).patch(asyncHandler(controller.update)).delete(asyncHandler(controller.remove));
export default router;
