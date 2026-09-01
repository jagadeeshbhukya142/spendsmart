import { Router } from 'express';
import { list } from '../controllers/categoryController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.get('/', asyncHandler(list));
export default router;
