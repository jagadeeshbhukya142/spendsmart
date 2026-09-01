import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sessionCookieName } from '../middleware/userContext.js';

const sevenDays = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, secure: env.nodeEnv === 'production', sameSite: 'lax', maxAge: sevenDays, path: '/' };

export function setSession(res, userId) {
  const token = jwt.sign({}, env.authSecret, { subject: userId, expiresIn: '7d' });
  res.cookie(sessionCookieName, token, cookieOptions);
}

export function clearSession(res) {
  res.clearCookie(sessionCookieName, { httpOnly: true, secure: env.nodeEnv === 'production', sameSite: 'lax', path: '/' });
}
