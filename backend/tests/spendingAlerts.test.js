import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { computeSpendingAlerts } from '../src/services/dashboardService.js';

const decimal = (value) => new Prisma.Decimal(value);

test('flags a category spending well above its trailing average', () => {
  const category = { id: 'cat-1', name: 'Entertainment' };
  const currentMonth = [{ category, amount: decimal(140) }];
  const baselineAverages = new Map([[category.id, decimal(80)]]);

  const alerts = computeSpendingAlerts(currentMonth, baselineAverages);

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].category.name, 'Entertainment');
  assert.equal(alerts[0].percentAboveAverage, 75);
});

test('does not flag a category within its normal range', () => {
  const category = { id: 'cat-2', name: 'Food' };
  const currentMonth = [{ category, amount: decimal(105) }];
  const baselineAverages = new Map([[category.id, decimal(100)]]);

  assert.deepEqual(computeSpendingAlerts(currentMonth, baselineAverages), []);
});

test('does not flag a category with no baseline history', () => {
  const category = { id: 'cat-3', name: 'New subscription' };
  const currentMonth = [{ category, amount: decimal(999) }];

  assert.deepEqual(computeSpendingAlerts(currentMonth, new Map()), []);
});

test('sorts multiple alerts by severity, worst first', () => {
  const mild = { id: 'cat-4', name: 'Shopping' };
  const severe = { id: 'cat-5', name: 'Dining' };
  const currentMonth = [
    { category: mild, amount: decimal(150) },
    { category: severe, amount: decimal(300) },
  ];
  const baselineAverages = new Map([[mild.id, decimal(100)], [severe.id, decimal(100)]]);

  const alerts = computeSpendingAlerts(currentMonth, baselineAverages);

  assert.deepEqual(alerts.map((alert) => alert.category.name), ['Dining', 'Shopping']);
});
