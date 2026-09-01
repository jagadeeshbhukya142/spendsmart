import AppError from '../utils/AppError.js';
import { dateValue, idValue, positiveAmount, transactionType } from './common.js';

const frequencies = ['WEEKLY', 'MONTHLY', 'YEARLY'];

export function validateRecurringTransaction(body, partial = false) {
  const data = {};
  if (!partial || body.categoryId !== undefined) data.categoryId = idValue(body.categoryId, 'categoryId');
  if (!partial || body.amount !== undefined) data.amount = positiveAmount(body.amount);
  if (!partial || body.type !== undefined) data.type = transactionType(body.type);
  if (!partial || body.frequency !== undefined) { data.frequency = String(body.frequency || '').toUpperCase(); if (!frequencies.includes(data.frequency)) throw new AppError('frequency must be weekly, monthly, or yearly.', 400, 'VALIDATION_ERROR'); }
  if (!partial || body.startDate !== undefined) data.startDate = dateValue(body.startDate, 'startDate');
  if (!partial || body.nextExecutionDate !== undefined) data.nextExecutionDate = dateValue(body.nextExecutionDate, 'nextExecutionDate');
  if (data.startDate && data.nextExecutionDate && data.nextExecutionDate < data.startDate) throw new AppError('nextExecutionDate cannot be before startDate.', 400, 'VALIDATION_ERROR');
  if (body.description !== undefined) { if (body.description !== null && typeof body.description !== 'string') throw new AppError('description must be a string.', 400, 'VALIDATION_ERROR'); data.description = body.description?.trim() || null; }
  if (body.active !== undefined) { if (typeof body.active !== 'boolean') throw new AppError('active must be a boolean.', 400, 'VALIDATION_ERROR'); data.active = body.active; }
  return data;
}
