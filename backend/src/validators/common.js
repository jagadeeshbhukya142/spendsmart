import AppError from '../utils/AppError.js';

export function positiveAmount(value, field = 'amount') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new AppError(`${field} must be a positive number.`, 400, 'VALIDATION_ERROR');
  return amount;
}

export function dateValue(value, field) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!value || Number.isNaN(date.getTime())) throw new AppError(`${field} must be a valid ISO date.`, 400, 'VALIDATION_ERROR');
  return date;
}

export function transactionType(value) {
  const type = String(value || '').toUpperCase();
  if (!['INCOME', 'EXPENSE'].includes(type)) throw new AppError('type must be income or expense.', 400, 'VALIDATION_ERROR');
  return type;
}

export function idValue(value, field = 'id') {
  if (!value || typeof value !== 'string') throw new AppError(`${field} is required.`, 400, 'VALIDATION_ERROR');
  return value;
}
