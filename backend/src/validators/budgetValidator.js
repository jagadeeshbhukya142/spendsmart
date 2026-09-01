import AppError from '../utils/AppError.js';
import { idValue, positiveAmount } from './common.js';

export function validateBudgetInput(body, partial = false) {
  const data = {};
  if (!partial || body.categoryId !== undefined) data.categoryId = idValue(body.categoryId, 'categoryId');
  if (!partial || body.amount !== undefined) data.amount = positiveAmount(body.amount);
  if (!partial || body.month !== undefined) {
    data.month = Number(body.month);
    if (!Number.isInteger(data.month) || data.month < 1 || data.month > 12) throw new AppError('month must be between 1 and 12.', 400, 'VALIDATION_ERROR');
  }
  if (!partial || body.year !== undefined) {
    data.year = Number(body.year);
    if (!Number.isInteger(data.year) || data.year < 2000 || data.year > 9999) throw new AppError('year must be a valid four-digit year.', 400, 'VALIDATION_ERROR');
  }
  return data;
}
