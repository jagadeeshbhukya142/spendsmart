import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import prisma from '../src/db/prisma.js';
import { env } from '../src/config/env.js';
import { sessionCookieName } from '../src/middleware/userContext.js';

const databaseTest = process.env.RUN_DATABASE_TESTS === '1' ? test : test.skip;

function call(server, method, path, userId, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const token = jwt.sign({}, env.authSecret, { subject: userId, expiresIn: '5m' });
    const request = http.request({ port: server.address().port, path, method, headers: { cookie: `${sessionCookieName}=${token}`, ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}) } }, (response) => {
      let content = ''; response.on('data', (chunk) => { content += chunk; }); response.on('end', () => resolve({ status: response.statusCode, body: content ? JSON.parse(content) : undefined }));
    });
    request.on('error', reject); if (payload) request.write(payload); request.end();
  });
}

databaseTest('database-backed transaction CRUD and dashboard calculations', async (t) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'demo.user@example.test' } });
  const category = await prisma.category.findFirstOrThrow({ where: { userId: user.id, name: 'Food' } });
  const budgetCategory = await prisma.category.findFirstOrThrow({ where: { userId: user.id, name: 'Transport' } });
  const server = http.createServer(app).listen(0);
  let transactionId; let budgetId;
  t.after(async () => { if (transactionId) await prisma.transaction.deleteMany({ where: { id: transactionId } }); if (budgetId) await prisma.budget.deleteMany({ where: { id: budgetId } }); await new Promise((resolve) => server.close(resolve)); await prisma.$disconnect(); });
  const created = await call(server, 'POST', '/api/transactions', user.id, { categoryId: category.id, amount: 42.5, type: 'expense', description: 'API integration test', transactionDate: '2026-08-21' });
  assert.equal(created.status, 201); transactionId = created.body.data.id;
  const listed = await call(server, 'GET', '/api/transactions?search=integration&minAmount=40&type=expense', user.id);
  assert.equal(listed.status, 200); assert.equal(listed.body.data.some((item) => item.id === transactionId), true);
  const updated = await call(server, 'PATCH', `/api/transactions/${transactionId}`, user.id, { amount: 45 });
  assert.equal(updated.status, 200); assert.equal(Number(updated.body.data.amount), 45);
  const summary = await call(server, 'GET', '/api/dashboard/summary', user.id);
  assert.equal(summary.status, 200); assert.equal(summary.body.success, true);
  const now = new Date();
  const createdBudget = await call(server, 'POST', '/api/budgets', user.id, { categoryId: budgetCategory.id, amount: 2000, month: now.getUTCMonth() + 1, year: now.getUTCFullYear() });
  assert.equal(createdBudget.status, 201); budgetId = createdBudget.body.data.id;
  const updatedBudget = await call(server, 'PATCH', `/api/budgets/${budgetId}`, user.id, { amount: 2500 });
  assert.equal(updatedBudget.status, 200); assert.equal(Number(updatedBudget.body.data.amount), 2500);
  const deletedBudget = await call(server, 'DELETE', `/api/budgets/${budgetId}`, user.id);
  assert.equal(deletedBudget.status, 204); budgetId = undefined;
  const deleted = await call(server, 'DELETE', `/api/transactions/${transactionId}`, user.id);
  assert.equal(deleted.status, 204); transactionId = undefined;
});

databaseTest('user isolation prevents one user from reading another user transaction', async (t) => {
  const suffix = Date.now();
  const [userA, userB] = await Promise.all(['a', 'b'].map((label) => prisma.user.create({ data: { name: `Isolation ${label}`, email: `isolation-${label}-${suffix}@example.test`, passwordHash: 'test-hash', categories: { create: { name: 'Other' } } }, include: { categories: true } })));
  const transaction = await prisma.transaction.create({ data: { userId: userA.id, categoryId: userA.categories[0].id, amount: 10, type: 'EXPENSE', transactionDate: new Date('2026-08-21') } });
  const server = http.createServer(app).listen(0);
  t.after(async () => { await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } }); await new Promise((resolve) => server.close(resolve)); await prisma.$disconnect(); });
  const otherUsersResponse = await call(server, 'GET', `/api/transactions/${transaction.id}`, userB.id);
  assert.equal(otherUsersResponse.status, 404);
});
