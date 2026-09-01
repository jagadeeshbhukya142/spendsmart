# SpendSmart

A personal finance tracker — log income and expenses, set category budgets, and see
where your money actually goes each month. Built as a full-stack project to get
hands-on with authentication, relational data modeling, and a production-shaped
Express API, not just another CRUD tutorial clone.

## Why two databases

Postgres (via Prisma) is the system of record for anything that has to be correct:
users, categories, transactions, budgets, recurring transaction rules. MongoDB holds
one thing only — per-user preferences and activity logs — because that data is
schema-light, read-heavy, and doesn't need relational integrity. It's a deliberate
split, not two databases bolted on because I could.

## Stack

- **Frontend** — React 19, React Router, Chart.js, Vite. Plain CSS with custom
  properties for theming (light/dark) rather than a CSS framework, so the design
  system is fully under my control.
- **Backend** — Node.js, Express, Prisma/PostgreSQL, MongoDB driver, JWT sessions in
  an HTTP-only cookie, bcrypt for password hashing.
- **Testing** — Vitest on the frontend, Node's built-in test runner on the backend
  (validators, auth, sessions, CSV parsing, and a dedicated security test file).

## Features

- Email/password auth with hashed passwords and short-lived, HTTP-only session
  cookies (no tokens sitting in `localStorage`).
- Dashboard: balance, income/expense/savings-rate snapshot, a monthly income vs.
  expense chart, category breakdown, recent activity, and budget status at a glance.
- Transactions: search, filter by category/type/date/amount, sort, paginate, CSV
  export, and CSV import with a preview step before anything is committed.
- Recurring transactions that materialize into real transactions on schedule.
- Budgets per category per month, with over/near/on-track status.
- Reports with trend and category analysis over a selectable time range.
- Per-user preferences (theme, currency, dashboard density, notification prefs).

## Running it locally

**Backend**

```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, MONGODB_URI, AUTH_SECRET
npm install
npm run prisma:deploy
npm run prisma:seed       # optional: sample data
npm run dev                # http://localhost:4000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173, proxies /api to the backend
```

See `backend/README.md` for the API surface and details on the CSV/recurring
transaction endpoints.

## Security notes

A few things I specifically paid attention to, since this is the part of the
project I'd expect to be asked about:

- Passwords are hashed with bcrypt (cost factor 12); the app never stores or logs
  plaintext passwords.
- Sessions are a JWT in an `httpOnly`, `sameSite=lax` cookie, `secure` in
  production — not accessible to JavaScript, which rules out a large class of
  XSS-driven session theft.
- Login always runs a bcrypt comparison, even for an email that doesn't exist, so
  response timing can't be used to enumerate registered accounts.
- All database access goes through Prisma's parameterized queries — no raw string
  concatenation into SQL.
- CORS is locked to a single configured origin with credentials, not `*`.
- Rate limiting is tighter on `/api/auth` (10 requests / 15 min) than the general
  API, to blunt credential-stuffing attempts.
- CSV uploads are capped at 1 MB / 500 rows and validated against the user's own
  categories before anything is inserted; imports are a two-step preview + confirm,
  not a blind bulk insert.
- `.env` is git-ignored; `.env.example` only ever contains placeholder values.

## What I'd do next

- Refresh tokens instead of a single long-lived session cookie.
- Server-side pagination cursors instead of offset-based paging for very large
  transaction histories.
- Move CSV import parsing off the request thread for large files.

## Author

Jagadeesh Bhukya
