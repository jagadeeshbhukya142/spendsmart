import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, CircleAlert, CircleCheck, LayoutDashboard, ListOrdered, Palette, Pencil, Plus, Target, Trash2, TrendingUp, WalletCards } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createBudget, deleteBudget, updateBudget } from '../services/budgetService';
import { getBudgetOverview, getCategorySpending, getMonthly } from '../services/dashboardService';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from '../utils/categoryIcons';
import { usePageTitle } from '../utils/usePageTitle';
import { BarChart, CATEGORY_COLOR_TOKENS } from '../components/dashboard/Charts';

const statusOrder = { over: 0, near: 1, 'on-track': 2 };

export function BudgetsPage() {
  usePageTitle('Budgets - SpendSmart');
  const { categories, dataVersion, refreshData, showToast } = useApp();
  const [budgets, setBudgets] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [remove, setRemove] = useState(null);
  const now = new Date();
  const period = { month: now.getMonth() + 1, year: now.getFullYear() };
  const periodLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(now);

  useEffect(() => {
    setBudgets(null);
    setError('');
    getBudgetOverview(period).then(setBudgets).catch((requestError) => setError(requestError.message));
  }, [dataVersion]);

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = { categoryId: form.categoryId, amount: Number(form.amount), month: Number(form.month), year: Number(form.year) };
      if (!payload.categoryId || !payload.amount) throw new Error('Category and monthly limit are required.');
      form.id ? await updateBudget(form.id, payload) : await createBudget(payload);
      setForm(null);
      refreshData();
      showToast(form.id ? 'Budget updated.' : 'Budget created.', 'success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteBudget(remove.id);
      setRemove(null);
      refreshData();
      showToast('Budget deleted.', 'success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const preparedBudgets = (budgets || []).map((budget) => ({ ...budget, percentage: budget.amount ? Math.round((budget.spent / budget.amount) * 100) : 0 })).map((budget) => ({ ...budget, status: budget.percentage >= 100 ? 'over' : budget.percentage >= 75 ? 'near' : 'on-track' })).sort((first, second) => statusOrder[first.status] - statusOrder[second.status] || second.percentage - first.percentage);
  const totals = preparedBudgets.reduce((total, budget) => ({ planned: total.planned + budget.amount, spent: total.spent + budget.spent, remaining: total.remaining + budget.remaining }), { planned: 0, spent: 0, remaining: 0 });
  const attentionCount = preparedBudgets.filter((budget) => budget.status !== 'on-track').length;
  const newBudget = () => setForm({ categoryId: '', amount: '', month: period.month, year: period.year });

  return <main className="page-content budgets-page">
    <section className="budgets-context"><div><h2>Budgets</h2><p>Plan and monitor category spending for {periodLabel}.</p></div><button type="button" className="btn btn-primary" onClick={newBudget}><Plus size={17} strokeWidth={2} /> Add budget</button></section>
    {error && <section className="budget-message"><CircleAlert size={20} strokeWidth={1.9} aria-hidden="true" /><div><h3>Budgets unavailable</h3><p>{error}</p></div></section>}
    {!budgets && !error && <section className="budget-loading" role="status">Loading budgets…</section>}
    {budgets && <>
      <section className="budget-overview" aria-label="Budget overview">
        <div className="budget-overview-primary"><div className="budget-overview-label"><WalletCards size={17} strokeWidth={1.9} aria-hidden="true" /> Total planned</div><div className="budget-overview-value">{formatCurrency(totals.planned)}</div><p>Across {preparedBudgets.length} {preparedBudgets.length === 1 ? 'budget' : 'budgets'} this month.</p></div>
        <div className="budget-overview-metrics"><OverviewMetric label="Spent" value={formatCurrency(totals.spent)} note="Recorded expense spending" /><OverviewMetric label="Remaining" value={formatCurrency(totals.remaining)} note={totals.remaining < 0 ? 'Above planned total' : 'Available to spend'} tone={totals.remaining < 0 ? 'over' : 'on-track'} /><OverviewMetric label="Needs attention" value={String(attentionCount)} note={attentionCount ? 'Near limit or over budget' : 'All budgets are on track'} tone={attentionCount ? 'near' : 'on-track'} /></div>
      </section>
      <section className="budgets-list-section" aria-labelledby="budget-list-title"><div className="budget-list-heading"><div><h3 id="budget-list-title">Category budgets</h3><p>Budgets needing attention are shown first.</p></div><span>{preparedBudgets.length} total</span></div>{preparedBudgets.length ? <div className="budget-list">{preparedBudgets.map((budget) => <BudgetRow key={budget.id} budget={budget} edit={() => setForm({ ...budget, categoryId: budget.categoryId })} remove={() => setRemove(budget)} />)}</div> : <div className="budget-empty"><Target size={24} strokeWidth={1.8} aria-hidden="true" /><strong>No budgets for this month</strong><span>Create a category budget to start tracking your spending plan.</span><button type="button" className="btn btn-primary" onClick={newBudget}><Plus size={17} strokeWidth={2} /> Add budget</button></div>}</section>
    </>}
    {form && <BudgetForm form={form} categories={categories} setForm={setForm} cancel={() => setForm(null)} save={save} />}
    {remove && <Confirm label={remove.category.name} cancel={() => setRemove(null)} confirm={confirmDelete} />}
  </main>;
}

function OverviewMetric({ label, value, note, tone = 'neutral' }) { return <div className={`budget-overview-metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function BudgetRow({ budget, edit, remove }) { const status = budget.status === 'over' ? 'Over budget' : budget.status === 'near' ? 'Near limit' : 'On track'; const Icon = budget.status === 'on-track' ? CircleCheck : CircleAlert; return <article className={`budget-row ${budget.status}`}><div className="budget-row-category"><div className="budget-row-icon"><CategoryIcon category={budget.category.name} size={17} strokeWidth={1.9} /></div><div><h4>{budget.category.name}</h4><span>{status}</span></div></div><div className="budget-row-progress"><div className="budget-row-values"><strong>{formatCurrency(budget.spent)} <span>of {formatCurrency(budget.amount)}</span></strong><span className="budget-row-percent">{budget.percentage}% used</span></div><div className="progress-bar" aria-label={`${budget.category.name}: ${budget.percentage}% of budget used`}><div className={`progress-fill ${budget.status === 'over' ? 'danger' : budget.status === 'near' ? 'warning' : 'safe'}`} style={{ width: `${Math.min(budget.percentage, 100)}%` }} /></div><div className="budget-row-remaining"><Icon size={14} strokeWidth={2} aria-hidden="true" />{budget.remaining < 0 ? `${formatCurrency(Math.abs(budget.remaining))} over budget` : `${formatCurrency(budget.remaining)} remaining`}</div></div><div className="budget-row-actions"><button type="button" onClick={edit}><Pencil size={15} strokeWidth={1.9} /> Edit</button><button type="button" className="danger-text" aria-label={`Delete ${budget.category.name} budget`} onClick={remove}><Trash2 size={15} strokeWidth={1.9} /></button></div></article>; }
function BudgetForm({ form, categories, setForm, cancel, save }) { return <div className="confirm-backdrop"><form className="confirm-dialog budget-form" role="dialog" aria-modal="true" aria-labelledby="budget-form-title" onSubmit={save}><h2 id="budget-form-title">{form.id ? 'Edit budget' : 'Create budget'}</h2><label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Monthly limit<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><div><button type="button" className="btn btn-outline" onClick={cancel}>Cancel</button><button className="btn btn-primary">Save budget</button></div></form></div>; }
export function ReportsPage() {
  usePageTitle('Reports - SpendSmart');
  const { dataVersion, preferences } = useApp();
  const [range, setRange] = useState(12);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const now = new Date();
  const period = { month: now.getMonth() + 1, year: now.getFullYear() };
  const periodLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(now);

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    Promise.all([getMonthly(range), getCategorySpending(period)]).then(([monthly, categories]) => {
      if (active) setData({ monthly, categories });
    }).catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, [range, dataVersion]);

  if (error) return <main className="page-content reports-page"><section className="reports-message"><CircleAlert size={20} strokeWidth={1.9} aria-hidden="true" /><div><h2>Reports unavailable</h2><p>{error}</p></div></section></main>;
  if (!data) return <main className="page-content reports-page"><section className="reports-loading" role="status">Loading reports…</section></main>;

  const totals = data.monthly.reduce((total, month) => ({ income: total.income + month.income, expenses: total.expenses + month.expense }), { income: 0, expenses: 0 });
  const net = totals.income - totals.expenses;
  const categoryTotal = data.categories.reduce((total, category) => total + category.amount, 0);
  const rankedCategories = [...data.categories].sort((first, second) => second.amount - first.amount);
  const topCategory = rankedCategories[0];
  const highestExpenseMonth = data.monthly.reduce((highest, month) => !highest || month.expense > highest.expense ? month : highest, null);
  const hasData = totals.income > 0 || totals.expenses > 0 || categoryTotal > 0;

  return <main className="page-content reports-page">
    <section className="reports-context"><div><h2>Reports</h2><p>Explore spending and income patterns over time.</p></div><div className="report-range" aria-label="Report date range">{[12, 6, 3].map((value) => <button key={value} type="button" className={range === value ? 'active' : ''} aria-pressed={range === value} onClick={() => setRange(value)}>{value}M</button>)}</div></section>
    {!hasData ? <section className="reports-empty"><BarChart3 size={25} strokeWidth={1.8} aria-hidden="true" /><strong>No report data for this period</strong><span>Add income or expense transactions to see trend and category analysis.</span></section> : <>
      <section className="reports-totals" aria-label="Selected period totals"><ReportMetric label="Income" value={formatCurrency(totals.income)} note={`Across the last ${range} months`} tone="income" icon={<ArrowUpRight size={17} strokeWidth={1.9} aria-hidden="true" />} /><ReportMetric label="Expenses" value={formatCurrency(totals.expenses)} note={`Across the last ${range} months`} tone="expense" icon={<ArrowDownRight size={17} strokeWidth={1.9} aria-hidden="true" />} /><ReportMetric label="Net difference" value={formatCurrency(net)} note={net >= 0 ? 'Income exceeded spending' : 'Spending exceeded income'} tone={net >= 0 ? 'income' : 'expense'} /></section>
      <section className="reports-trend" aria-labelledby="trend-title"><div className="reports-section-header"><div><h3 id="trend-title">Income and spending trend</h3><p>Monthly totals across the selected reporting period.</p></div></div><div className="reports-chart-wrap"><BarChart data={data.monthly} theme={preferences.theme} /></div></section>
      <div className="reports-analysis-grid"><section className="reports-category-analysis" aria-labelledby="category-title"><div className="reports-section-header"><div><h3 id="category-title">Spending by category</h3><p>{periodLabel} expenses, ranked by share.</p></div></div>{rankedCategories.length ? <div className="reports-category-list">{rankedCategories.map((category, index) => <div className="reports-category-row" key={category.category}><div className="reports-category-name"><span className="reports-category-dot" style={{ background: `var(${CATEGORY_COLOR_TOKENS[index % CATEGORY_COLOR_TOKENS.length]})` }} /><strong>{category.category}</strong></div><div className="reports-category-amount"><strong>{formatCurrency(category.amount)}</strong><span>{categoryTotal ? Math.round((category.amount / categoryTotal) * 100) : 0}%</span></div></div>)}</div> : <div className="reports-empty compact"><strong>No category spending this month</strong><span>Expense categories will appear here once transactions are recorded.</span></div>}</section>
        <section className="reports-insights" aria-labelledby="insights-title"><div className="reports-section-header"><div><h3 id="insights-title">Key patterns</h3><p>Directly calculated from your available data.</p></div></div><div className="insight-list"><Insight icon={<ListOrdered size={17} strokeWidth={1.9} aria-hidden="true" />} label="Top spending category" value={topCategory ? topCategory.category : 'No expenses'} note={topCategory ? `${formatCurrency(topCategory.amount)} this month` : 'No category data available'} /><Insight icon={<TrendingUp size={17} strokeWidth={1.9} aria-hidden="true" />} label="Highest expense month" value={highestExpenseMonth ? highestExpenseMonth.month : 'No data'} note={highestExpenseMonth ? formatCurrency(highestExpenseMonth.expense) : 'No monthly expense data available'} /><Insight icon={net >= 0 ? <ArrowUpRight size={17} strokeWidth={1.9} aria-hidden="true" /> : <ArrowDownRight size={17} strokeWidth={1.9} aria-hidden="true" />} label="Period net difference" value={formatCurrency(net)} note={net >= 0 ? 'Income was higher than expenses' : 'Expenses were higher than income'} /></div></section></div>
    </>}
  </main>;
}
function ReportMetric({ label, value, note, tone, icon }) { return <article className={`report-metric ${tone}`}><div>{icon}<span>{label}</span></div><strong>{value}</strong><small>{note}</small></article>; }
function Insight({ icon, label, value, note }) { return <div className="insight"><div className="insight-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>; }
export function SettingsPage() {
  usePageTitle('Settings - SpendSmart');
  const { preferences, savePreferences, showToast } = useApp();
  const [draft, setDraft] = useState(preferences);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(preferences), [preferences]);
  const save = async () => {
    setSaving(true);
    try {
      await savePreferences({ theme: draft.theme, currency: draft.currency, dashboardPreferences: draft.dashboardPreferences, notificationPreferences: draft.notificationPreferences });
      showToast('Preferences saved.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return <main className="page-content settings-page">
    <section className="settings-context"><div><h2>Settings</h2><p>Personalize how SpendSmart looks and presents your financial information.</p></div><button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save preferences'}</button></section>
    <section className="settings-section" aria-labelledby="appearance-title"><SettingsSectionHeading icon={<Palette size={18} strokeWidth={1.9} aria-hidden="true" />} id="appearance-title" title="Appearance" note="Choose the color mode and currency used throughout your workspace." /><div className="settings-group"><Setting title="Theme" note="Applies to the entire application after you save." control={<select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select>} /><Setting title="Display currency" note="Used when showing financial amounts." control={<select value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value })}><option value="INR">Indian Rupee (₹)</option><option value="USD">US Dollar ($)</option><option value="EUR">Euro (€)</option></select>} /></div></section>
    <section className="settings-section" aria-labelledby="dashboard-settings-title"><SettingsSectionHeading icon={<LayoutDashboard size={18} strokeWidth={1.9} aria-hidden="true" />} id="dashboard-settings-title" title="Dashboard" note="Control the amount of financial information shown in your overview." /><div className="settings-group"><Setting title="Show balances" note="Display balance and total amounts on the dashboard." control={<Toggle checked={draft.dashboardPreferences.showBalances} label="Show balances" onChange={(checked) => setDraft({ ...draft, dashboardPreferences: { ...draft.dashboardPreferences, showBalances: checked } })} />} /><Setting title="Compact dashboard" note="Use a denser layout for dashboard summary information." control={<Toggle checked={draft.dashboardPreferences.compactDashboard} label="Compact dashboard" onChange={(checked) => setDraft({ ...draft, dashboardPreferences: { ...draft.dashboardPreferences, compactDashboard: checked } })} />} /></div></section>
    <section className="settings-section" aria-labelledby="notifications-title"><SettingsSectionHeading icon={<Bell size={18} strokeWidth={1.9} aria-hidden="true" />} id="notifications-title" title="Notifications" note="Choose the financial reminders you want to receive." /><div className="settings-group"><Setting title="Budget alerts" note="Receive reminders when spending reaches budget thresholds." control={<Toggle checked={draft.notificationPreferences.budgetAlerts} label="Budget alerts" onChange={(checked) => setDraft({ ...draft, notificationPreferences: { ...draft.notificationPreferences, budgetAlerts: checked } })} />} /><Setting title="Weekly summary" note="Receive a weekly summary of financial activity." control={<Toggle checked={draft.notificationPreferences.weeklySummary} label="Weekly summary" onChange={(checked) => setDraft({ ...draft, notificationPreferences: { ...draft.notificationPreferences, weeklySummary: checked } })} />} /></div></section>
    <p className="settings-persistence-note">Changes are saved to your personal preferences when you select Save preferences.</p>
  </main>;
}
function SettingsSectionHeading({ icon, id, title, note }) { return <div className="settings-section-heading"><div className="settings-section-icon">{icon}</div><div><h3 id={id}>{title}</h3><p>{note}</p></div></div>; }
function Setting({ title, note, control }) { return <div className="setting-row"><div><strong>{title}</strong><p>{note}</p></div>{control}</div>; }
function Toggle({ checked, label, onChange }) { return <label className="settings-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true" /><span className="sr-only">{label}</span></label>; }
function Confirm({ label, cancel, confirm }) { return <div className="confirm-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-budget-title"><h2 id="delete-budget-title">Delete budget?</h2><p>This will permanently delete the {label} budget.</p><div><button type="button" className="btn btn-outline" onClick={cancel}>Cancel</button><button type="button" className="btn btn-danger" onClick={confirm}>Delete</button></div></section></div>; }
