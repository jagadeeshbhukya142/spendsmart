import prisma from '../db/prisma.js';
import AppError from '../utils/AppError.js';
import { ensureOwnedCategory } from './categoryService.js';

const includeCategory = { category: { select: { id: true, name: true } } };
const advance = (date, frequency) => { const next = new Date(date); if (frequency === 'WEEKLY') next.setUTCDate(next.getUTCDate() + 7); if (frequency === 'MONTHLY') next.setUTCMonth(next.getUTCMonth() + 1); if (frequency === 'YEARLY') next.setUTCFullYear(next.getUTCFullYear() + 1); return next; };

export const listRecurringTransactions = (userId) => prisma.recurringTransaction.findMany({ where: { userId }, include: includeCategory, orderBy: { nextExecutionDate: 'asc' } });
export async function createRecurringTransaction(userId, data) { await ensureOwnedCategory(userId, data.categoryId); return prisma.recurringTransaction.create({ data: { ...data, userId }, include: includeCategory }); }
export async function updateRecurringTransaction(userId, id, data) { const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } }); if (!existing) throw new AppError('Recurring transaction not found.', 404, 'RECURRING_TRANSACTION_NOT_FOUND'); if (data.categoryId) await ensureOwnedCategory(userId, data.categoryId); return prisma.recurringTransaction.update({ where: { id }, data, include: includeCategory }); }
export async function deleteRecurringTransaction(userId, id) { const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } }); if (!existing) throw new AppError('Recurring transaction not found.', 404, 'RECURRING_TRANSACTION_NOT_FOUND'); await prisma.recurringTransaction.delete({ where: { id } }); }

export async function executeDueRecurringTransactions(userId, now = new Date()) {
  const due = await prisma.recurringTransaction.findMany({ where: { userId, active: true, nextExecutionDate: { lte: now } } });
  let created = 0;
  for (const rule of due) {
    let occurrence = rule.nextExecutionDate;
    let executions = 0;
    while (occurrence <= now && executions < 120) {
      const currentOccurrence = occurrence;
      await prisma.$transaction(async (tx) => {
        await tx.transaction.upsert({ where: { recurringTransactionId_transactionDate: { recurringTransactionId: rule.id, transactionDate: currentOccurrence } }, create: { userId, categoryId: rule.categoryId, recurringTransactionId: rule.id, amount: rule.amount, type: rule.type, description: rule.description, transactionDate: currentOccurrence }, update: {} });
        occurrence = advance(currentOccurrence, rule.frequency);
        await tx.recurringTransaction.update({ where: { id: rule.id }, data: { nextExecutionDate: occurrence } });
      });
      created += 1;
      executions += 1;
    }
  }
  return { created };
}

export async function executeAllDueRecurringTransactions(now = new Date()) {
  const users = await prisma.recurringTransaction.findMany({ where: { active: true, nextExecutionDate: { lte: now } }, distinct: ['userId'], select: { userId: true } });
  const results = await Promise.all(users.map((user) => executeDueRecurringTransactions(user.userId, now)));
  return results.reduce((total, result) => total + result.created, 0);
}
