import { afterEach, assert, test, vi } from 'vitest';
import { login } from '../src/services/authService.js';
import { confirmCsvImport, createTransaction, deleteTransaction, getTransactions, previewCsvImport, updateTransaction } from '../src/services/transactionService.js';
import { createBudget } from '../src/services/budgetService.js';

const response = (data, meta) => ({ ok: true, status: 200, json: async () => ({ success: true, data, ...(meta ? { meta } : {}) }) });
afterEach(() => vi.restoreAllMocks());

test('login uses the cookie-authenticated API client', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ id: 'user-1' }));
  await login({ email: 'demo@example.test', password: 'password-123' });
  assert.equal(fetchMock.mock.calls[0][0], '/api/auth/login');
  assert.equal(fetchMock.mock.calls[0][1].credentials, 'include');
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { email: 'demo@example.test', password: 'password-123' });
});

test('transaction CRUD and filtering use the intended API payloads', async () => {
  const transaction = { id: 'transaction-1', amount: '20.00', type: 'EXPENSE', transactionDate: '2026-08-23T00:00:00.000Z', description: 'Lunch', category: { id: 'category-1', name: 'Food' } };
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response(transaction));
  await createTransaction({ categoryId: 'category-1', amount: 20, type: 'expense', description: 'Lunch', date: '2026-08-23' });
  await updateTransaction('transaction-1', { categoryId: 'category-1', amount: 25, type: 'expense', description: 'Lunch', date: '2026-08-23' });
  await deleteTransaction('transaction-1');
  fetchMock.mockResolvedValueOnce(response([transaction], { page: 1, total: 1, totalPages: 1, limit: 20 }));
  const listed = await getTransactions({ search: 'lunch', type: 'expense', page: 1, limit: 20 });
  assert.equal(fetchMock.mock.calls[0][0], '/api/transactions');
  assert.equal(fetchMock.mock.calls[1][0], '/api/transactions/transaction-1');
  assert.equal(fetchMock.mock.calls[2][1].method, 'DELETE');
  assert.match(fetchMock.mock.calls[3][0], /search=lunch/);
  assert.equal(listed.items[0].amount, 20);
});

test('budget creation and CSV preview/confirm send controlled request bodies', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ id: 'budget-1' }));
  await createBudget({ categoryId: 'category-1', amount: 1000, month: 8, year: 2026 });
  const file = new File(['Description,Category,Amount,Type,Date\nLunch,Food,20,expense,2026-08-23'], 'transactions.csv', { type: 'text/csv' });
  fetchMock.mockResolvedValueOnce(response({ previewToken: 'preview-1', summary: {} }));
  await previewCsvImport(file);
  fetchMock.mockResolvedValueOnce(response({ imported: 1 }));
  await confirmCsvImport('preview-1');
  assert.equal(fetchMock.mock.calls[0][0], '/api/budgets');
  assert.equal(fetchMock.mock.calls[1][1].body instanceof FormData, true);
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[2][1].body), { previewToken: 'preview-1' });
});
