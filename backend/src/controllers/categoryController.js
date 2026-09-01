import { listCategories } from '../services/categoryService.js';
import { sendSuccess } from '../utils/response.js';

export async function list(req, res) { return sendSuccess(res, await listCategories(req.user.id)); }
