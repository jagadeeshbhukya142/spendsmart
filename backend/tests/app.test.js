import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import app from '../src/app.js';

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      http.get({ port: server.address().port, path, headers }, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => { server.close(); resolve({ status: response.statusCode, body: JSON.parse(body) }); });
      }).on('error', reject);
    });
  });
}

test('health endpoint is publicly available', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, 'ok');
});

test('protected API endpoints reject unauthenticated requests', async () => {
  const response = await request('/api/transactions');
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHENTICATED');
});

test('legacy user headers cannot authenticate a request', async () => {
  const response = await request('/api/transactions', { 'x-user-id': 'someone-else' });
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHENTICATED');
});

test('category API is protected like other account data', async () => {
  const response = await request('/api/categories');
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHENTICATED');
});

test('CSV and recurring APIs are protected like financial data', async () => {
  const [csv, recurring] = await Promise.all([request('/api/transactions/export'), request('/api/recurring-transactions')]);
  assert.equal(csv.status, 401);
  assert.equal(recurring.status, 401);
});
