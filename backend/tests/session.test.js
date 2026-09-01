import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { setSession } from '../src/utils/session.js';
import { env } from '../src/config/env.js';

test('session is HTTP-only and signed for the authenticated user', () => {
  let captured;
  const response = { cookie: (...args) => { captured = args; } };
  setSession(response, 'user-123');
  const [name, token, options] = captured;
  assert.equal(name, 'spendsmart_session');
  assert.equal(options.httpOnly, true);
  assert.equal(jwt.verify(token, env.authSecret).sub, 'user-123');
});
