import * as transactions from '../services/transactionService.js';
import { parseTransactionQuery, validateTransactionInput } from '../validators/transactionValidator.js';
import { sendSuccess } from '../utils/response.js';
import { ActivityEvent, recordActivity } from '../services/activityService.js';

export async function list(req, res) { const result = await transactions.listTransactions(req.user.id, parseTransactionQuery(req.query)); return sendSuccess(res, result.items, 200, result.meta); }
export async function getById(req, res) { return sendSuccess(res, await transactions.getTransaction(req.user.id, req.params.id)); }
export async function create(req, res) { const transaction = await transactions.createTransaction(req.user.id, validateTransactionInput(req.body)); await recordActivity(req.user.id, ActivityEvent.TRANSACTION_CREATED, { transactionId: transaction.id, categoryId: transaction.categoryId, type: transaction.type }); return sendSuccess(res, transaction, 201); }
export async function update(req, res) { const transaction = await transactions.updateTransaction(req.user.id, req.params.id, validateTransactionInput(req.body, true)); await recordActivity(req.user.id, ActivityEvent.TRANSACTION_UPDATED, { transactionId: transaction.id }); return sendSuccess(res, transaction); }
export async function remove(req, res) { await transactions.deleteTransaction(req.user.id, req.params.id); await recordActivity(req.user.id, ActivityEvent.TRANSACTION_DELETED, { transactionId: req.params.id }); return res.status(204).send(); }
