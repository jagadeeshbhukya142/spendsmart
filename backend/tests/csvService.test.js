import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeCsvValue } from '../src/services/csvService.js';

test('CSV export escapes formula-like values and quotes', () => {
  assert.equal(escapeCsvValue('=SUM(A1:A2)'), "\"'=SUM(A1:A2)\"");
  assert.equal(escapeCsvValue('A "quote"'), '"A ""quote"""');
});
