import AppError from '../utils/AppError.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(body) {
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!name || name.length < 2 || name.length > 100) throw new AppError('name must be between 2 and 100 characters.', 400, 'VALIDATION_ERROR');
  if (!email || !emailPattern.test(email) || email.length > 254) throw new AppError('A valid email address is required.', 400, 'VALIDATION_ERROR');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new AppError('password must be between 8 and 128 characters.', 400, 'VALIDATION_ERROR');
  return { name, email, password };
}

export function validateLogin(body) {
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !emailPattern.test(email) || typeof password !== 'string' || !password) throw new AppError('Email and password are required.', 400, 'VALIDATION_ERROR');
  return { email, password };
}
