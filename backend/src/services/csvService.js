import { randomUUID } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import prisma from '../db/prisma.js';
import AppError from '../utils/AppError.js';

const previews = new Map();
const requiredHeaders = ['description', 'category', 'amount', 'type', 'date'];
const previewLifetimeMs = 15 * 60 * 1000;
const cleanHeader = (value) => String(value || '').trim().toLowerCase();
const cleanText = (value) => String(value ?? '').trim();

function parseDate(value) { const valueAsText = cleanText(value); if (!/^\d{4}-\d{2}-\d{2}$/.test(valueAsText)) return null; const date = new Date(`${valueAsText}T00:00:00.000Z`); return Number.isNaN(date.getTime()) ? null : date; }
function normalizeType(value) { const type = cleanText(value).toUpperCase(); return ['INCOME', 'EXPENSE'].includes(type) ? type : null; }
function fingerprint(row) { return `${row.categoryId}|${row.amount}|${row.type}|${row.transactionDate.toISOString()}|${row.description || ''}`; }

async function existingFingerprints(userId, rows) {
  const dates = [...new Set(rows.map((row) => row.transactionDate.toISOString()))].map((date) => new Date(date));
  if (!dates.length) return new Set();
  const records = await prisma.transaction.findMany({ where: { userId, transactionDate: { in: dates } }, select: { categoryId: true, amount: true, type: true, transactionDate: true, description: true } });
  return new Set(records.map((record) => fingerprint(record)));
}

export async function previewCsvImport(userId, buffer) {
  let records;
  try { records = parse(buffer, { columns: (headers) => headers.map(cleanHeader), skip_empty_lines: true, trim: true, bom: true, relax_column_count: false, max_record_size: 10_000 }); } catch { throw new AppError('The CSV file could not be parsed.', 400, 'INVALID_CSV'); }
  if (!records.length) throw new AppError('The CSV file has no data rows.', 400, 'INVALID_CSV');
  if (records.length > 500) throw new AppError('CSV imports are limited to 500 rows.', 400, 'CSV_ROW_LIMIT');
  const headers = Object.keys(records[0]); const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new AppError(`Missing required columns: ${missing.join(', ')}.`, 400, 'INVALID_CSV_COLUMNS');
  const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true } });
  const categoryMap = new Map(categories.map((category) => [category.name.toLowerCase(), category])); const validRows = []; const invalidRows = [];
  records.forEach((record, index) => {
    const amount = Number(cleanText(record.amount)); const type = normalizeType(record.type); const transactionDate = parseDate(record.date); const category = categoryMap.get(cleanText(record.category).toLowerCase()); const description = cleanText(record.description) || null; const issues = [];
    if (!category) issues.push('Unknown category'); if (!Number.isFinite(amount) || amount <= 0) issues.push('Amount must be positive'); if (!type) issues.push('Type must be income or expense'); if (!transactionDate) issues.push('Date must be YYYY-MM-DD'); if (description?.length > 1000) issues.push('Description is too long');
    if (issues.length) invalidRows.push({ row: index + 2, issues }); else validRows.push({ row: index + 2, categoryId: category.id, category: category.name, amount, type, transactionDate, description });
  });
  const existing = await existingFingerprints(userId, validRows); const seen = new Set(); const duplicates = []; const accepted = [];
  validRows.forEach((row) => { const key = fingerprint(row); if (existing.has(key) || seen.has(key)) duplicates.push({ row: row.row, reason: existing.has(key) ? 'Already exists' : 'Duplicate in upload' }); else { seen.add(key); accepted.push(row); } });
  const token = randomUUID(); previews.set(token, { userId, rows: accepted, expiresAt: Date.now() + previewLifetimeMs });
  return { previewToken: token, expiresInSeconds: previewLifetimeMs / 1000, summary: { total: records.length, valid: accepted.length, invalid: invalidRows.length, duplicates: duplicates.length }, rows: accepted.map((row) => ({ row: row.row, category: row.category, amount: row.amount, type: row.type.toLowerCase(), date: row.transactionDate.toISOString().slice(0, 10), description: row.description })), invalidRows, duplicates };
}

export async function confirmCsvImport(userId, previewToken) {
  const preview = previews.get(previewToken); previews.delete(previewToken);
  if (!preview || preview.userId !== userId || preview.expiresAt < Date.now()) throw new AppError('The import preview has expired. Upload the file again.', 400, 'IMPORT_PREVIEW_EXPIRED');
  const existing = await existingFingerprints(userId, preview.rows); const rows = preview.rows.filter((row) => !existing.has(fingerprint(row)));
  if (rows.length) await prisma.transaction.createMany({ data: rows.map((row) => ({ userId, categoryId: row.categoryId, amount: row.amount, type: row.type, description: row.description, transactionDate: row.transactionDate })) });
  return { imported: rows.length, skippedDuplicates: preview.rows.length - rows.length };
}

export function escapeCsvValue(value) { const text = value === null || value === undefined ? '' : String(value); const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${safe.replaceAll('"', '""')}"`; }
