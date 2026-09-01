import prisma from '../db/prisma.js';
import AppError from '../utils/AppError.js';
import { ensureOwnedCategory } from './categoryService.js';

const includeCategory = { category: { select: { id: true, name: true } } };

export async function listTransactions(userId, filters) {
  const where = {
    userId,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.search ? { OR: [{ description: { contains: filters.search, mode: 'insensitive' } }, { category: { name: { contains: filters.search, mode: 'insensitive' } } }] } : {}),
    ...(filters.from || filters.to ? { transactionDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}),
    ...(filters.minAmount || filters.maxAmount ? { amount: { ...(filters.minAmount ? { gte: filters.minAmount } : {}), ...(filters.maxAmount ? { lte: filters.maxAmount } : {}) } } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({ where, include: includeCategory, skip: (filters.page - 1) * filters.limit, take: filters.limit, orderBy: [{ [filters.sortBy]: filters.sortOrder }, { id: 'desc' }] }),
    prisma.transaction.count({ where }),
  ]);
  return { items, meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function getTransaction(userId, id) {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId }, include: includeCategory });
  if (!transaction) throw new AppError('Transaction not found.', 404, 'TRANSACTION_NOT_FOUND');
  return transaction;
}

export async function createTransaction(userId, data) {
  await ensureOwnedCategory(userId, data.categoryId);
  return prisma.transaction.create({ data: { ...data, userId }, include: includeCategory });
}

export async function updateTransaction(userId, id, data) {
  await getTransaction(userId, id);
  if (data.categoryId) await ensureOwnedCategory(userId, data.categoryId);
  return prisma.transaction.update({ where: { id }, data, include: includeCategory });
}

export async function deleteTransaction(userId, id) {
  await getTransaction(userId, id);
  await prisma.transaction.delete({ where: { id } });
}
