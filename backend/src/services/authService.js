import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import AppError from '../utils/AppError.js';

const defaultCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Other'];
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });

export async function registerUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists.', 409, 'EMAIL_ALREADY_EXISTS');
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({ data: { name, email, passwordHash, categories: { create: defaultCategories.map((categoryName) => ({ name: categoryName })) } } });
    return publicUser(user);
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('An account with this email already exists.', 409, 'EMAIL_ALREADY_EXISTS');
    throw error;
  }
}

// A fixed dummy hash so a lookup miss still pays the cost of a bcrypt compare.
// Without this, an unknown email returns faster than a known one with a wrong
// password, which lets an attacker enumerate registered accounts by timing.
const dummyHash = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8i8t6a2f6PjA1v/OT5j5Vp5W5qN5Fu';

export async function authenticateUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
  if (!user || !passwordMatches) throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  return publicUser(user);
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Your account is no longer available.', 401, 'UNAUTHENTICATED');
  return publicUser(user);
}
