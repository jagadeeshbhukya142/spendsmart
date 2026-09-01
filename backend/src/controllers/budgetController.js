import * as budgets from '../services/budgetService.js';
import { validateBudgetInput } from '../validators/budgetValidator.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { ActivityEvent, recordActivity } from '../services/activityService.js';

function monthYear(query) { const month = query.month === undefined ? undefined : Number(query.month); const year = query.year === undefined ? undefined : Number(query.year); if ((month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) || (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 9999))) throw new AppError('month and year filters must be valid.', 400, 'VALIDATION_ERROR'); return { month, year }; }
export async function list(req, res) { return sendSuccess(res, await budgets.listBudgets(req.user.id, monthYear(req.query))); }
export async function create(req, res) { const budget = await budgets.createBudget(req.user.id, validateBudgetInput(req.body)); await recordActivity(req.user.id, ActivityEvent.BUDGET_CREATED, { budgetId: budget.id, categoryId: budget.categoryId, month: budget.month, year: budget.year }); return sendSuccess(res, budget, 201); }
export async function update(req, res) { return sendSuccess(res, await budgets.updateBudget(req.user.id, req.params.id, validateBudgetInput(req.body, true))); }
export async function remove(req, res) { await budgets.deleteBudget(req.user.id, req.params.id); return res.status(204).send(); }
