import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTransactionQuery, validateTransactionInput } from '../src/validators/transactionValidator.js';
import { validateBudgetInput } from '../src/validators/budgetValidator.js';

test('transaction input accepts positive amounts and normalizes type', () => {
  const transaction = validateTransactionInput({ categoryId: 'category-1', amount: '250.50', type: 'expense', transactionDate: '2026-08-21', description: ' Lunch ' });
  assert.equal(transaction.amount, 250.5);
  assert.equal(transaction.type, 'EXPENSE');
  assert.equal(transaction.description, 'Lunch');
});

test('transaction query supports pagination and filtering', () => {
  const query = parseTransactionQuery({ page: '2', limit: '15', type: 'income', from: '2026-08-01', to: '2026-08-21', minAmount: '10', maxAmount: '900', sortBy: 'amount', sortOrder: 'asc' });
  assert.equal(query.page, 2);
  assert.equal(query.limit, 15);
  assert.equal(query.type, 'INCOME');
  assert.equal(query.sortBy, 'amount');
  assert.equal(query.sortOrder, 'asc');
});

test('validators reject invalid budget months and non-positive amounts', () => {
  assert.throws(() => validateBudgetInput({ categoryId: 'category-1', amount: 500, month: 13, year: 2026 }));
  assert.throws(() => validateTransactionInput({ categoryId: 'category-1', amount: 0, type: 'expense', transactionDate: '2026-08-21' }));
});
