import * as dashboard from '../services/dashboardService.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

function period(query, requireValues = false) { const now = new Date(); const month = Number(query.month || now.getUTCMonth() + 1); const year = Number(query.year || now.getUTCFullYear()); if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 9999 || (requireValues && (!query.month || !query.year))) throw new AppError('month and year must be valid.', 400, 'VALIDATION_ERROR'); return { month, year }; }
export async function summary(req, res) { return sendSuccess(res, await dashboard.getSummary(req.user.id)); }
export async function monthly(req, res) { const months = Math.min(24, Math.max(1, Number.parseInt(req.query.months, 10) || 6)); return sendSuccess(res, await dashboard.getMonthly(req.user.id, months)); }
export async function categories(req, res) { return sendSuccess(res, await dashboard.getCategories(req.user.id, period(req.query))); }
export async function budgets(req, res) { return sendSuccess(res, await dashboard.getBudgetOverview(req.user.id, period(req.query))); }
export async function alerts(req, res) { return sendSuccess(res, await dashboard.getSpendingAlerts(req.user.id, period(req.query))); }
