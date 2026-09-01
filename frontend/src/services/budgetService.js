import { api, queryString } from './api';

export async function getBudgets(filters) { const response = await api(`/budgets${queryString(filters)}`); return response.data.map((budget) => ({ ...budget, amount: Number(budget.amount) })); }
export const createBudget = (data) => api('/budgets', { method: 'POST', body: JSON.stringify(data) });
export const updateBudget = (id, data) => api(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBudget = (id) => api(`/budgets/${id}`, { method: 'DELETE' });
