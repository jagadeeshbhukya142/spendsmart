import * as csv from '../services/csvService.js';
import { parseTransactionQuery } from '../validators/transactionValidator.js';
import { listTransactions } from '../services/transactionService.js';
import { ActivityEvent, recordActivity } from '../services/activityService.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

export async function preview(req, res) { if (!req.file) throw new AppError('A CSV file is required.', 400, 'CSV_FILE_REQUIRED'); return sendSuccess(res, await csv.previewCsvImport(req.user.id, req.file.buffer)); }
export async function confirm(req, res) { const result = await csv.confirmCsvImport(req.user.id, req.body.previewToken); if (result.imported) await recordActivity(req.user.id, ActivityEvent.CSV_IMPORTED, { imported: result.imported, skippedDuplicates: result.skippedDuplicates }); return sendSuccess(res, result, 201); }
export async function exportTransactions(req, res) {
  const filters = parseTransactionQuery({ ...req.query, page: 1, limit: 100 }); const items = [];
  do { const result = await listTransactions(req.user.id, filters); items.push(...result.items); if (filters.page >= result.meta.totalPages) break; filters.page += 1; } while (true);
  const rows = [['Description', 'Category', 'Amount', 'Type', 'Date'], ...items.map((item) => [item.description || '', item.category.name, item.amount, item.type, item.transactionDate.toISOString().slice(0, 10)])];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="spendsmart-transactions.csv"'); return res.send(`\uFEFF${rows.map((row) => row.map(csv.escapeCsvValue).join(',')).join('\r\n')}`);
}
