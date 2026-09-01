import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePreferenceUpdate } from '../src/validators/preferenceValidator.js';

test('preference updates support documented preference fields only', () => {
  const update = validatePreferenceUpdate({ theme: 'light', currency: 'USD', dashboardPreferences: { compactDashboard: true }, notificationPreferences: { budgetAlerts: false } });
  assert.equal(update.theme, 'light');
  assert.equal(update.currency, 'USD');
  assert.equal(update['dashboardPreferences.compactDashboard'], true);
  assert.equal(update['notificationPreferences.budgetAlerts'], false);
});

test('preference updates reject unsupported fields', () => {
  assert.throws(() => validatePreferenceUpdate({ theme: 'blue' }));
  assert.throws(() => validatePreferenceUpdate({ dashboardPreferences: { showNetWorth: true } }));
  assert.throws(() => validatePreferenceUpdate({}));
});
