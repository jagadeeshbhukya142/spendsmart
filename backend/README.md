# SpendSmart API

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `MONGODB_URI`, and `AUTH_SECRET`.
2. Run `npm install`, `npm run prisma:deploy`, and `npm run prisma:seed` for a local database.
3. Start the server with `npm run dev`.

## Authentication

- `POST /api/auth/register` accepts `name`, `email`, and `password`.
- `POST /api/auth/login` accepts `email` and `password`.
- `POST /api/auth/logout` clears the HTTP-only `spendsmart_session` cookie.
- `GET /api/auth/me` returns the signed-in user.

All other `/api` routes require the signed session cookie. `X-User-Id` is not accepted. Browser clients must send requests with credentials enabled.

## MongoDB document data

MongoDB stores only `user_preferences` and `activity_logs`. PostgreSQL remains the source of truth for users, categories, transactions, budgets, and recurring transactions.

- `GET /api/preferences` returns the signed-in user's preferences, falling back to safe defaults when no document exists.
- `PATCH /api/preferences` updates supported theme, currency, dashboard, and notification preferences with an upsert.

Important actions add activity-log events containing IDs and event context only; logs do not contain passwords, transaction descriptions, or amounts.

## CSV and recurring transactions

- `POST /api/transactions/import/preview` accepts one `file` multipart field. CSV imports are limited to 1 MB and 500 rows, require `Description, Category, Amount, Type, Date`, validate values against the signed-in user's categories, and return invalid/duplicate rows without inserting anything.
- `POST /api/transactions/import/confirm` accepts the returned `previewToken` and inserts only the reviewed non-duplicate rows.
- `GET /api/transactions/export` exports only the signed-in user's filtered transactions and escapes formula-like cells for spreadsheet safety.
- `/api/recurring-transactions` manages recurring definitions. `POST /api/recurring-transactions/run-due` creates due ordinary transactions from active rules; generated transactions reference their source rule to prevent duplicates.

## Checks

`npm test` runs non-database security and validation tests. `RUN_DATABASE_TESTS=1 npm run test:integration` runs tests that create and clean up records, so use it only against an approved local/test database.
