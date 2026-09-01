import * as recurring from '../services/recurringTransactionService.js';
import { validateRecurringTransaction } from '../validators/recurringTransactionValidator.js';
import { sendSuccess } from '../utils/response.js';

export async function list(req, res) { return sendSuccess(res, await recurring.listRecurringTransactions(req.user.id)); }
export async function create(req, res) { return sendSuccess(res, await recurring.createRecurringTransaction(req.user.id, validateRecurringTransaction(req.body)), 201); }
export async function update(req, res) { return sendSuccess(res, await recurring.updateRecurringTransaction(req.user.id, req.params.id, validateRecurringTransaction(req.body, true))); }
export async function remove(req, res) { await recurring.deleteRecurringTransaction(req.user.id, req.params.id); return res.status(204).send(); }
export async function runDue(req, res) { return sendSuccess(res, await recurring.executeDueRecurringTransactions(req.user.id)); }
