import { api, queryString } from './api';

export const getSummary = async () => (await api('/dashboard/summary')).data;
export const getMonthly = async (months) => (await api(`/dashboard/monthly${queryString({ months })}`)).data.map((item) => ({ ...item, income: Number(item.income), expense: Number(item.expenses) }));
export const getCategorySpending = async (period) => (await api(`/dashboard/categories${queryString(period)}`)).data.map((item) => ({ category: item.category.name, amount: Number(item.amount) }));
export const getBudgetOverview = async (period) => (await api(`/dashboard/budgets${queryString(period)}`)).data.map((item) => ({ ...item, amount: Number(item.amount), spent: Number(item.spent), remaining: Number(item.remaining) }));
export const getSpendingAlerts = async (period) => (await api(`/dashboard/alerts${queryString(period)}`)).data.map((item) => ({ ...item, category: item.category.name, currentAmount: Number(item.currentAmount), averageAmount: Number(item.averageAmount) }));
