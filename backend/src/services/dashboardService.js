import prisma from '../db/prisma.js';
import { Prisma } from '@prisma/client';

const monthRange = (year, month) => ({ gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) });

export async function getSummary(userId) {
  const [income, expenses] = await Promise.all(['INCOME', 'EXPENSE'].map((type) => prisma.transaction.aggregate({ where: { userId, type }, _sum: { amount: true } })));
  const totalIncome = income._sum.amount || new Prisma.Decimal(0);
  const totalExpenses = expenses._sum.amount || new Prisma.Decimal(0);
  return { totalIncome, totalExpenses, balance: totalIncome.minus(totalExpenses) };
}

export async function getMonthly(userId, months = 6) {
  const now = new Date(); const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));
  const transactions = await prisma.transaction.findMany({ where: { userId, transactionDate: { gte: start } }, select: { amount: true, type: true, transactionDate: true } });
  const result = new Map();
  for (let offset = 0; offset < months; offset += 1) { const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1 + offset, 1)); const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; result.set(key, { month: key, income: new Prisma.Decimal(0), expenses: new Prisma.Decimal(0) }); }
  transactions.forEach((transaction) => { const key = `${transaction.transactionDate.getUTCFullYear()}-${String(transaction.transactionDate.getUTCMonth() + 1).padStart(2, '0')}`; const item = result.get(key); if (item) item[transaction.type === 'INCOME' ? 'income' : 'expenses'] = item[transaction.type === 'INCOME' ? 'income' : 'expenses'].plus(transaction.amount); });
  return [...result.values()];
}

export async function getCategories(userId, { month, year }) {
  const where = { userId, type: 'EXPENSE', ...(month && year ? { transactionDate: monthRange(year, month) } : {}) };
  const grouped = await prisma.transaction.groupBy({ by: ['categoryId'], where, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } });
  const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((item) => item.categoryId) } }, select: { id: true, name: true } });
  return grouped.map((item) => ({ category: categories.find((category) => category.id === item.categoryId), amount: item._sum.amount || new Prisma.Decimal(0) }));
}

export async function getBudgetOverview(userId, { month, year }) {
  const budgets = await prisma.budget.findMany({ where: { userId, month, year }, include: { category: { select: { id: true, name: true } } } });
  const spending = await prisma.transaction.groupBy({ by: ['categoryId'], where: { userId, type: 'EXPENSE', transactionDate: monthRange(year, month) }, _sum: { amount: true } });
  return budgets.map((budget) => { const spent = spending.find((item) => item.categoryId === budget.categoryId)?._sum.amount || new Prisma.Decimal(0); return { ...budget, spent, remaining: budget.amount.minus(spent), overBudget: spent.greaterThan(budget.amount) }; });
}

// Flags categories where the current month's spending is running well above
// that category's own recent baseline. Deliberately simple: a trailing
// 3-month average per category, current month checked against it. No model,
// no external service - just arithmetic a reviewer can verify by hand, which
// matters more here than sophistication. A category needs at least one of
// the three prior months of spending to have a baseline at all, which avoids
// flagging a brand-new category's first purchase as a 300% "spike".
export const ALERT_THRESHOLD = 1.4; // 40% above baseline

// Pure calculation, kept separate from the Prisma calls above so it can be
// unit tested with plain data instead of a real database.
export function computeSpendingAlerts(currentMonthSpending, baselineAverages) {
  return currentMonthSpending
    .map(({ category, amount }) => {
      const average = baselineAverages.get(category.id);
      if (!average || average.isZero() || !amount.greaterThan(average.times(ALERT_THRESHOLD))) return null;
      return {
        category,
        currentAmount: amount,
        averageAmount: average,
        percentAboveAverage: amount.dividedBy(average).minus(1).times(100).toDecimalPlaces(0).toNumber(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.percentAboveAverage - a.percentAboveAverage);
}

export async function getSpendingAlerts(userId, { month, year }) {
  const currentMonth = await getCategories(userId, { month, year });

  const baselineStart = new Date(Date.UTC(year, month - 4, 1));
  const baselineEnd = new Date(Date.UTC(year, month - 1, 1));
  const priorTransactions = await prisma.transaction.findMany({
    where: { userId, type: 'EXPENSE', transactionDate: { gte: baselineStart, lt: baselineEnd } },
    select: { categoryId: true, amount: true, transactionDate: true },
  });

  const baselineByCategory = new Map();
  priorTransactions.forEach((transaction) => {
    const monthKey = `${transaction.transactionDate.getUTCFullYear()}-${transaction.transactionDate.getUTCMonth()}`;
    const entry = baselineByCategory.get(transaction.categoryId) || { total: new Prisma.Decimal(0), months: new Set() };
    entry.total = entry.total.plus(transaction.amount);
    entry.months.add(monthKey);
    baselineByCategory.set(transaction.categoryId, entry);
  });

  const baselineAverages = new Map();
  baselineByCategory.forEach((entry, categoryId) => {
    if (entry.months.size > 0) baselineAverages.set(categoryId, entry.total.dividedBy(entry.months.size));
  });

  return computeSpendingAlerts(currentMonth, baselineAverages);
}
