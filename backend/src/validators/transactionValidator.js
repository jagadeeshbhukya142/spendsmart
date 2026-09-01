import AppError from '../utils/AppError.js';
import { dateValue, idValue, positiveAmount, transactionType } from './common.js';

export function validateTransactionInput(body, partial = false) {
  const data = {};
  if (!partial || body.categoryId !== undefined) data.categoryId = idValue(body.categoryId, 'categoryId');
  if (!partial || body.amount !== undefined) data.amount = positiveAmount(body.amount);
  if (!partial || body.type !== undefined) data.type = transactionType(body.type);
  if (!partial || body.transactionDate !== undefined) data.transactionDate = dateValue(body.transactionDate, 'transactionDate');
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') throw new AppError('description must be a string.', 400, 'VALIDATION_ERROR');
    data.description = body.description?.trim() || null;
  }
  return data;
}

export function parseTransactionQuery(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const sortBy = ['transactionDate', 'amount', 'createdAt'].includes(query.sortBy) ? query.sortBy : 'transactionDate';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const filters = { page, limit, sortBy, sortOrder, search: query.search?.trim() || undefined, categoryId: query.categoryId || undefined };
  if (query.type) filters.type = transactionType(query.type);
  if (query.from) filters.from = dateValue(query.from, 'from');
  if (query.to) filters.to = dateValue(query.to, 'to');
  if (filters.from && filters.to && filters.from > filters.to) throw new AppError('from must be before to.', 400, 'VALIDATION_ERROR');
  if (query.minAmount !== undefined) { filters.minAmount = Number(query.minAmount); if (!Number.isFinite(filters.minAmount) || filters.minAmount < 0) throw new AppError('minAmount must be zero or greater.', 400, 'VALIDATION_ERROR'); }
  if (query.maxAmount !== undefined) { filters.maxAmount = Number(query.maxAmount); if (!Number.isFinite(filters.maxAmount) || filters.maxAmount < 0) throw new AppError('maxAmount must be zero or greater.', 400, 'VALIDATION_ERROR'); }
  if (filters.minAmount && filters.maxAmount && filters.minAmount > filters.maxAmount) throw new AppError('minAmount cannot exceed maxAmount.', 400, 'VALIDATION_ERROR');
  return filters;
}
