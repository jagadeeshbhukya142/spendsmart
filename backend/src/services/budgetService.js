import prisma from '../db/prisma.js';
import AppError from '../utils/AppError.js';
import { ensureOwnedCategory } from './categoryService.js';

const includeCategory = { category: { select: { id: true, name: true } } };

export async function listBudgets(userId, { month, year }) {
  const where = { userId, ...(month ? { month } : {}), ...(year ? { year } : {}) };
  return prisma.budget.findMany({ where, include: includeCategory, orderBy: [{ year: 'desc' }, { month: 'desc' }, { category: { name: 'asc' } }] });
}

export async function createBudget(userId, data) {
  await ensureOwnedCategory(userId, data.categoryId);
  return prisma.budget.create({ data: { ...data, userId }, include: includeCategory });
}

export async function updateBudget(userId, id, data) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError('Budget not found.', 404, 'BUDGET_NOT_FOUND');
  if (data.categoryId) await ensureOwnedCategory(userId, data.categoryId);
  return prisma.budget.update({ where: { id }, data, include: includeCategory });
}

export async function deleteBudget(userId, id) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError('Budget not found.', 404, 'BUDGET_NOT_FOUND');
  await prisma.budget.delete({ where: { id } });
}
