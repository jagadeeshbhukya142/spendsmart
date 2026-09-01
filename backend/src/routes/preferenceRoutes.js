import { Router } from 'express';
import * as controller from '../controllers/preferenceController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.get('/', asyncHandler(controller.get));
router.patch('/', asyncHandler(controller.update));
export default router;
