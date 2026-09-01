import * as auth from '../services/authService.js';
import { validateLogin, validateRegistration } from '../validators/authValidator.js';
import { clearSession, setSession } from '../utils/session.js';
import { sendSuccess } from '../utils/response.js';
import { ActivityEvent, recordActivity } from '../services/activityService.js';

export async function register(req, res) { const user = await auth.registerUser(validateRegistration(req.body)); setSession(res, user.id); await recordActivity(user.id, ActivityEvent.USER_REGISTERED); return sendSuccess(res, user, 201); }
export async function login(req, res) { const user = await auth.authenticateUser(validateLogin(req.body)); setSession(res, user.id); await recordActivity(user.id, ActivityEvent.USER_LOGIN); return sendSuccess(res, user); }
export async function logout(req, res) { clearSession(res); await recordActivity(req.user.id, ActivityEvent.USER_LOGOUT); return res.status(204).send(); }
export async function me(req, res) { return sendSuccess(res, await auth.getCurrentUser(req.user.id)); }
