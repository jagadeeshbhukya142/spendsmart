import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTransactionInput } from '../src/validators/transactionValidator.js';
import { validateBudgetInput } from '../src/validators/budgetValidator.js';
import { validateRegistration } from '../src/validators/authValidator.js';

test('security validators reject negative and malformed financial values', () => {
  assert.throws(() => validateTransactionInput({ categoryId: 'category-1', amount: -1, type: 'expense', transactionDate: '2026-08-23' }));
  assert.throws(() => validateTransactionInput({ categoryId: 'category-1', amount: 10, type: 'transfer', transactionDate: 'not-a-date' }));
  assert.throws(() => validateBudgetInput({ categoryId: 'category-1', amount: 0, month: 1, year: 2026 }));
});

test('registration validation rejects malformed login credentials', () => {
  assert.throws(() => validateRegistration({ name: 'A', email: 'invalid', password: 'short' }));
});
