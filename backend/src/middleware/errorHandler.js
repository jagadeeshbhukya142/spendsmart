import { Prisma } from '@prisma/client';
import multer from 'multer';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} was not found.` } });
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error instanceof multer.MulterError ? 400 : (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' ? 409 : 500));
  const code = statusCode >= 500 ? 'INTERNAL_ERROR' : (error.code === 'P2002' ? 'CONFLICT' : error.code || 'BAD_REQUEST');
  const message = error instanceof multer.MulterError ? 'The CSV file is too large or invalid.' : (statusCode >= 500 ? 'An unexpected error occurred.' : error.message);
  if (statusCode >= 500 && env.nodeEnv !== 'test') console.error(error);
  return res.status(statusCode).json({ success: false, error: { code, message } });
}
