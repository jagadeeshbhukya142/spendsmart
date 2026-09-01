# SpendSmart

A personal finance tracker. Log income and expenses, set monthly budgets per
category, and see where your money goes.

## Stack

- **Frontend:** React 19, React Router, Chart.js, Vite
- **Backend:** Node.js, Express, PostgreSQL (Prisma), MongoDB
- **Auth:** JWT in an HTTP-only cookie, passwords hashed with bcrypt
- **Testing:** Vitest (frontend), Node's built-in test runner (backend)

## Why two databases

PostgreSQL holds everything that must stay consistent: users, transactions,
categories, budgets. MongoDB holds one thing: user preferences and activity
logs. That data is simple and read-heavy, so it doesn't need a relational
schema.

## Features

- Sign up / log in with hashed passwords and secure session cookies
- Dashboard: balance, income/expenses, monthly trend chart, category
  breakdown, recent transactions, budget status
- Spending alerts: flags a category when it's 40%+ above its own 3-month
  average
- Transactions: search, filter, sort, paginate, CSV import and export
- Recurring transactions that generate real transactions on schedule
- Budgets per category per month, with over/near/on-track status
- Reports with spending trends over time
- Light and dark theme

## Running it locally

**Backend**
```bash
cd backend
cp .env.example .env      # add your DATABASE_URL, MONGODB_URI, AUTH_SECRET
npm install
npm run prisma:deploy
npm run dev                # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173` and create an account. Full API details are in
[`backend/README.md`](backend/README.md).

## Security

- Passwords hashed with bcrypt (cost factor 12)
- Sessions are HTTP-only, `sameSite` cookies — not readable by JavaScript
- Login takes the same time whether the email exists or not, to prevent
  account enumeration
- All database queries go through Prisma (no raw SQL)
- CORS locked to one origin
- Login and register are rate-limited; only failed attempts count
- CSV imports are capped at 1MB / 500 rows and previewed before anything is
  saved
- `.env` is git-ignored; `.env.example` has placeholders only

## What's next

- Refresh tokens instead of one long-lived session
- Cursor-based pagination for large transaction lists
- Move CSV parsing off the main request thread

## License

MIT — see [LICENSE](LICENSE).

## Author

Jagadeesh Bhukya