import { api } from './api';

const toRule = (rule) => ({ ...rule, amount: Number(rule.amount), type: rule.type.toLowerCase(), startDate: rule.startDate.slice(0, 10), nextExecutionDate: rule.nextExecutionDate.slice(0, 10) });
export const getRecurringTransactions = async () => (await api('/recurring-transactions')).data.map(toRule);
export const createRecurringTransaction = async (data) => toRule((await api('/recurring-transactions', { method: 'POST', body: JSON.stringify(data) })).data);
export const updateRecurringTransaction = async (id, data) => toRule((await api(`/recurring-transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })).data);
export const deleteRecurringTransaction = (id) => api(`/recurring-transactions/${id}`, { method: 'DELETE' });
export const runDueRecurringTransactions = async () => (await api('/recurring-transactions/run-due', { method: 'POST' })).data;
