import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/authController.js';
import { requireUserContext } from '../middleware/userContext.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

// Only failed attempts count against the limit - a successful login or a string
// of validation errors while someone is still typing their email shouldn't burn
// through the same budget as an actual brute-force attempt. Register gets a
// looser limit than login since a real attacker gains far less from spamming
// account creation than from guessing a password.
function authRateLimiter({ limit, windowMinutes }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res, next, options) => {
      const resetSeconds = Number(res.getHeader('ratelimit-reset')) || windowMinutes * 60;
      const retryMinutes = Math.max(1, Math.ceil(resetSeconds / 60));
      res.status(options.statusCode).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Too many attempts. Try again in about ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        },
      });
    },
  });
}

const loginLimiter = authRateLimiter({ limit: 10, windowMinutes: 15 });
const registerLimiter = authRateLimiter({ limit: 20, windowMinutes: 15 });

router.post('/register', registerLimiter, asyncHandler(controller.register));
router.post('/login', loginLimiter, asyncHandler(controller.login));
router.post('/logout', requireUserContext, asyncHandler(controller.logout));
router.get('/me', requireUserContext, asyncHandler(controller.me));
export default router;
