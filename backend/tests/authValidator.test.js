import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLogin, validateRegistration } from '../src/validators/authValidator.js';

test('registration input trims and normalizes an email', () => {
  const data = validateRegistration({ name: ' Sample User ', email: ' SAMPLE@Example.test ', password: 'long-enough-password' });
  assert.equal(data.name, 'Sample User');
  assert.equal(data.email, 'sample@example.test');
});

test('registration rejects an invalid email and weak password', () => {
  assert.throws(() => validateRegistration({ name: 'Sample User', email: 'not-an-email', password: 'long-enough-password' }));
  assert.throws(() => validateRegistration({ name: 'Sample User', email: 'sample@example.test', password: 'short' }));
});

test('login requires both valid email and password', () => {
  assert.throws(() => validateLogin({ email: 'sample@example.test' }));
  assert.equal(validateLogin({ email: 'sample@example.test', password: 'password' }).email, 'sample@example.test');
});
