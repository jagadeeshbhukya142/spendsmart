import { api, apiBaseUrl, queryString } from './api';

const toTransaction = (transaction) => ({ ...transaction, amount: Number(transaction.amount), type: transaction.type.toLowerCase(), date: transaction.transactionDate.slice(0, 10), title: transaction.description || transaction.category.name });
export async function getTransactions(filters) { const response = await api(`/transactions${queryString(filters)}`); return { items: response.data.map(toTransaction), meta: response.meta }; }
export async function createTransaction(data) { const response = await api('/transactions', { method: 'POST', body: JSON.stringify({ categoryId: data.categoryId, amount: Number(data.amount), type: data.type, description: data.description?.trim() || null, transactionDate: data.date }) }); return toTransaction(response.data); }
export async function updateTransaction(id, data) { const response = await api(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify({ categoryId: data.categoryId, amount: Number(data.amount), type: data.type, description: data.description?.trim() || null, transactionDate: data.date }) }); return toTransaction(response.data); }
export const deleteTransaction = (id) => api(`/transactions/${id}`, { method: 'DELETE' });
export async function previewCsvImport(file) { const form = new FormData(); form.append('file', file); return (await api('/transactions/import/preview', { method: 'POST', body: form })).data; }
export const confirmCsvImport = async (previewToken) => (await api('/transactions/import/confirm', { method: 'POST', body: JSON.stringify({ previewToken }) })).data;
export async function exportTransactions(filters) { const response = await fetch(`${apiBaseUrl}/transactions/export${queryString(filters)}`, { credentials: 'include' }); if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error?.message || 'Export failed.'); } return response.blob(); }
