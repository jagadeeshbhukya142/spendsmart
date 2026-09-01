import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import { env } from '../config/env.js';

export const sessionCookieName = 'spendsmart_session';

export function requireUserContext(req, res, next) {
  const token = req.cookies?.[sessionCookieName];
  if (!token) return next(new AppError('Authentication is required.', 401, 'UNAUTHENTICATED'));
  try {
    const payload = jwt.verify(token, env.authSecret);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(new AppError('Your session is invalid or has expired.', 401, 'UNAUTHENTICATED'));
  }
}
