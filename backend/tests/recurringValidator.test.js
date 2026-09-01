import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRecurringTransaction } from '../src/validators/recurringTransactionValidator.js';

test('recurring transaction input normalizes type and frequency', () => {
  const rule = validateRecurringTransaction({ categoryId: 'category-1', amount: '15000', type: 'expense', frequency: 'monthly', startDate: '2026-08-01', nextExecutionDate: '2026-09-01', active: true });
  assert.equal(rule.type, 'EXPENSE');
  assert.equal(rule.frequency, 'MONTHLY');
  assert.equal(rule.amount, 15000);
});

test('recurring transaction input rejects an invalid frequency', () => {
  assert.throws(() => validateRecurringTransaction({ categoryId: 'category-1', amount: 1, type: 'expense', frequency: 'daily', startDate: '2026-08-01', nextExecutionDate: '2026-09-01' }));
});
