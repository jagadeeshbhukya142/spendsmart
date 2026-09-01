import prisma from '../db/prisma.js';
import AppError from '../utils/AppError.js';

export async function ensureOwnedCategory(userId, categoryId) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new AppError('Category was not found for this user.', 404, 'CATEGORY_NOT_FOUND');
  return category;
}

export function listCategories(userId) {
  return prisma.category.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
}
