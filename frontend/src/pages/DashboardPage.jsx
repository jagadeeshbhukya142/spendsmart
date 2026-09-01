import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Landmark, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getBudgetOverview, getCategorySpending, getMonthly, getSpendingAlerts, getSummary } from '../services/dashboardService';
import { getTransactions } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/categoryIcons';
import { usePageTitle } from '../utils/usePageTitle';
import { BarChart, CATEGORY_COLOR_TOKENS, SpendingChart } from '../components/dashboard/Charts';

const hiddenAmount = '••••••';

export default function DashboardPage() {
  usePageTitle('Dashboard - SpendSmart');
  const { dataVersion, preferences } = useApp();
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const now = new Date();
  const period = { month: now.getMonth() + 1, year: now.getFullYear() };
  const periodLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(now);

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    Promise.all([
      getSummary(),
      getMonthly(range),
      getCategorySpending(period),
      getBudgetOverview(period),
      getSpendingAlerts(period),
      getTransactions({ page: 1, limit: 7, sortBy: 'transactionDate', sortOrder: 'desc' }),
    ]).then(([summary, monthly, categories, budgets, alerts, transactions]) => {
      if (active) setData({ summary, monthly, categories, budgets, alerts, recent: transactions.items });
    }).catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, [range, dataVersion]);

  if (error) return <main className="page-content dashboard-page"><section className="dashboard-message"><h2>Dashboard unavailable</h2><p>{error}</p></section></main>;
  if (!data) return <main className="page-content dashboard-page"><div className="dashboard-loading" role="status">Loading dashboard…</div></main>;

  const summary = {
    income: Number(data.summary.totalIncome),
    expenses: Number(data.summary.totalExpenses),
    balance: Number(data.summary.balance),
  };
  const savingsRate = summary.income > 0 ? Math.round(((summary.income - summary.expenses) / summary.income) * 100) : 0;
  const showBalances = preferences.dashboardPreferences.showBalances;
  const displayAmount = (amount) => showBalances ? formatCurrency(amount) : hiddenAmount;
  const budgetItems = data.budgets.map((budget) => ({
    ...budget,
    percentage: budget.amount ? Math.round((budget.spent / budget.amount) * 100) : 0,
  })).sort((first, second) => second.percentage - first.percentage).slice(0, 4);
  const budgetTotals = data.budgets.reduce((totals, budget) => ({ amount: totals.amount + budget.amount, spent: totals.spent + budget.spent }), { amount: 0, spent: 0 });

  return <main className={`page-content dashboard-page ${preferences.dashboardPreferences.compactDashboard ? 'compact-dashboard' : ''}`}>
    <section className="dashboard-context" aria-labelledby="snapshot-title">
      <div><h2 id="snapshot-title">Financial snapshot</h2><p>{periodLabel} activity and your current balance.</p></div>
    </section>

    <section className="financial-snapshot" aria-label="Financial snapshot">
      <article className="balance-summary">
        <div className="snapshot-label"><Landmark size={17} strokeWidth={1.9} aria-hidden="true" /> Current balance</div>
        <div className="balance-value">{displayAmount(summary.balance)}</div>
        <p>Income minus expenses across your account.</p>
      </article>
      <div className="snapshot-metrics">
        <SnapshotMetric label="Income" value={displayAmount(summary.income)} description="All recorded income" icon={<TrendingUp size={17} strokeWidth={1.9} aria-hidden="true" />} tone="income" />
        <SnapshotMetric label="Expenses" value={displayAmount(summary.expenses)} description="All recorded expenses" icon={<TrendingDown size={17} strokeWidth={1.9} aria-hidden="true" />} tone="expense" />
        <SnapshotMetric label="Savings rate" value={showBalances ? `${savingsRate}%` : hiddenAmount} description="Of recorded income retained" tone="neutral" />
      </div>
    </section>

    {data.alerts.length > 0 && <section className="dashboard-surface spending-alerts" aria-labelledby="alerts-title">
      <div className="dashboard-section-header"><div><h2 id="alerts-title">Spending alerts</h2><p>Categories running well above their usual pace this month.</p></div></div>
      <div className="alert-list">{data.alerts.map((alert) => <SpendingAlert key={alert.category} alert={alert} displayAmount={displayAmount} />)}</div>
    </section>}

    <div className="dashboard-primary-grid">
      <section className="dashboard-surface activity-chart" aria-labelledby="activity-title">
        <div className="dashboard-section-header">
          <div><h2 id="activity-title">Financial activity</h2><p>Income and expenses over the selected period.</p></div>
          <div className="chart-tabs" aria-label="Chart date range">{[7, 3, 1].map((value) => <button key={value} className={`chart-tab ${range === value ? 'active' : ''}`} aria-pressed={range === value} onClick={() => setRange(value)}>{value}M</button>)}</div>
        </div>
        <div className="chart-wrap"><BarChart data={data.monthly} theme={preferences.theme} /></div>
      </section>

      <section className="dashboard-surface recent-transactions" aria-labelledby="recent-title">
        <div className="dashboard-section-header"><div><h2 id="recent-title">Recent transactions</h2><p>Latest activity in your account.</p></div><Link to="/transactions" className="view-all-link">View all</Link></div>
        <div className="txn-list">{data.recent.map((item) => <TransactionItem key={item.id} item={item} displayAmount={displayAmount} />)}{!data.recent.length && <div className="dashboard-empty"><strong>No transactions yet</strong><span>Transactions you add will appear here.</span></div>}</div>
      </section>
    </div>

    <div className="dashboard-secondary-grid">
      <section className="dashboard-surface category-spending" aria-labelledby="spending-title">
        <div className="dashboard-section-header"><div><h2 id="spending-title">Spending by category</h2><p>{periodLabel}</p></div></div>
        {data.categories.length ? <div className="category-chart-content"><div className="pie-wrap"><SpendingChart items={data.categories} theme={preferences.theme} /></div><CategoryLegend items={data.categories} displayAmount={displayAmount} /></div> : <div className="dashboard-empty"><strong>No expense data this month</strong><span>Category spending will appear after expense transactions are added.</span></div>}
      </section>

      {data.budgets.length > 0 && <section className="dashboard-surface budget-status" aria-labelledby="budget-title">
        <div className="dashboard-section-header"><div><h2 id="budget-title">Budget status</h2><p>{displayAmount(budgetTotals.spent)} of {displayAmount(budgetTotals.amount)} planned this month.</p></div><Link to="/budgets" className="view-all-link">Manage budgets</Link></div>
        <div className="budget-items">{budgetItems.map((budget) => <BudgetItem key={budget.id} budget={budget} displayAmount={displayAmount} />)}</div>
      </section>}
    </div>
  </main>;
}

function SnapshotMetric({ label, value, description, icon, tone }) {
  return <article className={`snapshot-metric ${tone}`}><div className="snapshot-metric-heading">{icon}{label}</div><div className="snapshot-metric-value">{value}</div><p>{description}</p></article>;
}

function SpendingAlert({ alert, displayAmount }) {
  return <div className="alert-item">
    <div className="alert-icon" aria-hidden="true"><TriangleAlert size={16} strokeWidth={2} /></div>
    <div className="alert-details">
      <p><strong>{alert.category}</strong> is {alert.percentAboveAverage}% above its usual month</p>
      <span>{displayAmount(alert.currentAmount)} this month vs. a {displayAmount(alert.averageAmount)} average</span>
    </div>
  </div>;
}

function TransactionItem({ item, displayAmount }) {
  const isIncome = item.type === 'income';
  return <div className="txn-item">
    <div className="txn-icon"><CategoryIcon category={item.category.name} size={16} strokeWidth={1.9} /></div>
    <div className="txn-details"><div className="txn-name">{item.title}</div><div className="txn-category">{item.category.name} · {formatDate(item.date)}</div></div>
    <div className="txn-right"><div className={`txn-amount ${isIncome ? 'credit' : 'debit'}`}>{isIncome ? <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" /> : <ArrowDownLeft size={15} strokeWidth={2} aria-hidden="true" />}{isIncome ? '+' : '-'}{displayAmount(item.amount)}</div><div className="txn-direction">{isIncome ? 'Income' : 'Expense'}</div></div>
  </div>;
}

function CategoryLegend({ items, displayAmount }) {
  return <div className="category-legend">{items.map((item, index) => <div className="legend-item" key={item.category}><span className="legend-dot" style={{ background: `var(${CATEGORY_COLOR_TOKENS[index % CATEGORY_COLOR_TOKENS.length]})` }} /><span className="legend-name">{item.category}</span><span className="legend-amount">{displayAmount(item.amount)}</span></div>)}</div>;
}

function BudgetItem({ budget, displayAmount }) {
  const tone = budget.percentage >= 100 ? 'danger' : budget.percentage >= 75 ? 'warning' : 'safe';
  const status = budget.percentage >= 100 ? 'Over budget' : budget.percentage >= 75 ? 'Near limit' : 'On track';
  return <div className="budget-item"><div className="budget-item-top"><span className="budget-cat"><CategoryIcon category={budget.category.name} size={15} strokeWidth={1.9} /> {budget.category.name}</span><span className={`budget-pct ${tone}`}>{budget.percentage}%</span></div><div className="progress-bar" aria-label={`${budget.category.name}: ${budget.percentage}% of budget used`}><div className={`progress-fill ${tone}`} style={{ width: `${Math.min(budget.percentage, 100)}%` }} /></div><div className="budget-amounts"><span>{displayAmount(budget.spent)} of {displayAmount(budget.amount)}</span><span>{status}</span></div></div>;
}
