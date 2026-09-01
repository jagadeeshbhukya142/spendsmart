import { useEffect, useState } from 'react';
import { ChevronDown, FileUp, Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TransactionModal from '../components/common/TransactionModal';
import { confirmCsvImport, deleteTransaction, exportTransactions, getTransactions, previewCsvImport } from '../services/transactionService';
import { createRecurringTransaction, deleteRecurringTransaction, getRecurringTransactions, runDueRecurringTransactions, updateRecurringTransaction } from '../services/recurringTransactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/categoryIcons';
import { usePageTitle } from '../utils/usePageTitle';

const initialFilters = { search: '', categoryId: '', type: '', from: '', to: '', minAmount: '', maxAmount: '', sortBy: 'transactionDate', sortOrder: 'desc', page: 1, limit: 20 };

export default function TransactionsPage() {
  usePageTitle('Transactions - SpendSmart');
  const { categories, dataVersion, refreshData, showToast } = useApp();
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(null);
      setError('');
      getTransactions(filters).then(setResult).catch((requestError) => setError(requestError.message));
    }, 200);
    return () => clearTimeout(timer);
  }, [filters, dataVersion]);

  useEffect(() => {
    const exportData = async () => {
      try {
        const blob = await exportTransactions(filters);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'spendsmart-transactions.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('Transactions exported.', 'success');
      } catch (requestError) {
        showToast(requestError.message, 'error');
      }
    };
    document.addEventListener('spendsmart-export', exportData);
    return () => document.removeEventListener('spendsmart-export', exportData);
  }, [filters, showToast]);

  const set = (key) => (event) => setFilters({ ...filters, [key]: event.target.value, page: 1 });
  const clear = () => setFilters(initialFilters);
  const remove = async () => {
    try {
      await deleteTransaction(deleting.id);
      setDeleting(null);
      refreshData();
      showToast('Transaction deleted.', 'success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      setPreview(await previewCsvImport(file));
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };
  const confirmImport = async () => {
    try {
      const summary = await confirmCsvImport(preview.previewToken);
      setPreview(null);
      refreshData();
      showToast(`Imported ${summary.imported} transactions.`, 'success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };
  const items = result?.items || [];
  const meta = result?.meta;
  const activeFilters = Boolean(filters.search || filters.categoryId || filters.type || filters.from || filters.to || filters.minAmount || filters.maxAmount || filters.sortBy !== initialFilters.sortBy || filters.sortOrder !== initialFilters.sortOrder);

  return <main className="page-content transactions-page">
    <section className="transactions-context"><div><h2>Transactions</h2><p>Search, review, and manage your financial activity.</p></div></section>

    <section className="transaction-controls" aria-label="Transaction search and filters">
      <div className="search-wrap"><Search className="search-icon" size={17} strokeWidth={1.9} aria-hidden="true" /><input className="search-input" placeholder="Search descriptions or categories" value={filters.search} onChange={set('search')} /></div>
      <div className="filters">
        <select className="filter-select" value={filters.categoryId} onChange={set('categoryId')} aria-label="Filter by category"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select className="filter-select" value={filters.type} onChange={set('type')} aria-label="Filter by type"><option value="">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select>
        <select className="filter-select" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split(':'); setFilters({ ...filters, sortBy, sortOrder, page: 1 }); }} aria-label="Sort transactions"><option value="transactionDate:desc">Newest first</option><option value="transactionDate:asc">Oldest first</option><option value="amount:desc">Highest amount</option><option value="amount:asc">Lowest amount</option></select>
      </div>
      <div className="transaction-control-actions"><button type="button" className="btn btn-outline filter-toggle" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}><SlidersHorizontal size={16} strokeWidth={1.9} /> More filters</button>{activeFilters && <button type="button" className="clear-filters" onClick={clear}><X size={14} strokeWidth={2} /> Clear</button>}</div>
      {moreFiltersOpen && <div className="advanced-filters transaction-advanced-filters"><label>From<input type="date" value={filters.from} onChange={set('from')} /></label><label>To<input type="date" value={filters.to} onChange={set('to')} /></label><label>Min amount<input type="number" min="0" value={filters.minAmount} onChange={set('minAmount')} /></label><label>Max amount<input type="number" min="0" value={filters.maxAmount} onChange={set('maxAmount')} /></label></div>}
    </section>

    <details className="transaction-tools">
      <summary><span>Import & recurring</span><span className="transaction-tools-summary">CSV import and recurring rules <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" /></span></summary>
      <div className="transaction-tools-content">
        <section className="csv-panel"><div><strong>Import transactions</strong><p>CSV columns: Description, Category, Amount, Type, Date. Files are validated before import.</p></div><label className="btn btn-outline"><FileUp size={16} strokeWidth={1.9} /> {importing ? 'Validating…' : 'Upload CSV'}<input type="file" accept=".csv,text/csv" hidden disabled={importing} onChange={upload} /></label></section>
        <RecurringPanel categories={categories} refreshData={refreshData} showToast={showToast} />
      </div>
    </details>
    {preview && <CsvPreview preview={preview} cancel={() => setPreview(null)} confirm={confirmImport} />}

    {error && <div className="page-error">{error}</div>}
    <div className="transactions-list-header"><div className="results-info">{result ? <>Showing <span>{items.length}</span> of {meta.total} transactions</> : 'Loading transactions…'}</div>{result && <span className="transactions-list-note">Amounts are shown as income or expense.</span>}</div>
    <div className="txn-table-wrap"><table className="txn-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Type</th><th className="amount-header">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td data-label="Transaction"><div className="txn-name-cell"><div className="txn-table-icon"><CategoryIcon category={item.category.name} size={16} strokeWidth={1.9} /></div><div><div className="txn-table-name">{item.title}</div><div className="txn-table-sub">{item.description || 'No description'}</div></div></div></td><td data-label="Category"><span className="category-pill">{item.category.name}</span></td><td className="date-cell" data-label="Date">{formatDate(item.date, true)}</td><td data-label="Type"><span className={`type-badge ${item.type}`}>{item.type}</span></td><td className={`txn-amount-cell ${item.type === 'income' ? 'credit' : 'debit'}`} data-label="Amount">{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}</td><td className="transaction-row-actions" data-label="Actions"><button type="button" onClick={() => setEditing(item)}>Edit</button><button type="button" className="danger-text" onClick={() => setDeleting(item)}>Delete</button></td></tr>)}</tbody></table>{result && !items.length && <div className="empty-state"><div className="empty-title">{activeFilters ? 'No matching transactions' : 'No transactions yet'}</div><div className="empty-desc">{activeFilters ? 'Try changing your search or filters.' : 'Add a transaction to start building your activity history.'}</div>{activeFilters && <button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>}</div>}</div>
    {meta?.totalPages > 1 && <div className="pagination"><button className="btn btn-outline" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button><span>Page {meta.page} of {meta.totalPages}</span><button className="btn btn-outline" disabled={filters.page === meta.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button></div>}
    <TransactionModal isOpen={Boolean(editing)} transaction={editing} onClose={() => setEditing(null)} />
    {deleting && <Confirm item={deleting} cancel={() => setDeleting(null)} confirm={remove} />}
  </main>;
}

function Confirm({ item, cancel, confirm }) { return <div className="confirm-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title"><h2 id="delete-transaction-title">Delete transaction?</h2><p>This will permanently delete “{item.title}”.</p><div><button type="button" className="btn btn-outline" onClick={cancel}>Cancel</button><button type="button" className="btn btn-danger" onClick={confirm}>Delete</button></div></section></div>; }
function CsvPreview({ preview, cancel, confirm }) {
  return <section className="csv-preview">
    <div><strong>Import preview</strong><span>{preview.summary.valid} ready · {preview.summary.invalid} invalid · {preview.summary.duplicates} duplicates</span></div>
    {preview.rows.length > 0 && <table><thead><tr><th>Description</th><th>Category</th><th>Amount</th><th>Type</th><th>Date</th></tr></thead><tbody>{preview.rows.slice(0, 8).map((row) => <tr key={row.row}><td>{row.description || '—'}</td><td>{row.category}</td><td>{row.amount}</td><td>{row.type}</td><td>{row.date}</td></tr>)}</tbody></table>}
    {preview.invalidRows.length > 0 && <p className="danger-text">Invalid rows: {preview.invalidRows.map((row) => `${row.row} (${row.issues.join(', ')})`).join('; ')}</p>}
    {preview.duplicates.length > 0 && <p>Duplicate rows skipped: {preview.duplicates.map((row) => row.row).join(', ')}</p>}
    <div className="csv-actions"><button type="button" className="btn btn-outline" onClick={cancel}>Cancel</button><button type="button" className="btn btn-primary" disabled={!preview.summary.valid} onClick={confirm}>Confirm import</button></div>
  </section>;
}
function RecurringPanel({ categories, refreshData, showToast }) {
  const [rules, setRules] = useState([]); const [open, setOpen] = useState(false); const [form, setForm] = useState({ categoryId: '', amount: '', type: 'expense', description: '', frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10), nextExecutionDate: new Date().toISOString().slice(0, 10), active: true });
  const load = () => getRecurringTransactions().then(setRules).catch((error) => showToast(error.message, 'error'));
  useEffect(() => { load(); }, []);
  const save = async (event) => { event.preventDefault(); try { const payload = { ...form, amount: Number(form.amount) }; if (form.id) await updateRecurringTransaction(form.id, payload); else await createRecurringTransaction(payload); setOpen(false); load(); showToast('Recurring rule saved.', 'success'); } catch (error) { showToast(error.message, 'error'); } };
  const runDue = async () => { try { const result = await runDueRecurringTransactions(); load(); refreshData(); showToast(`${result.created} due transaction${result.created === 1 ? '' : 's'} created.`, 'success'); } catch (error) { showToast(error.message, 'error'); } };
  return <section className="recurring-panel"><div className="recurring-panel-header"><div><strong>Recurring transactions</strong><p>Create rules separately; running due rules creates actual transactions.</p></div><div className="panel-actions"><button type="button" className="btn btn-outline" onClick={runDue}>Run due rules</button><button type="button" className="btn btn-primary" onClick={() => { setForm({ categoryId: '', amount: '', type: 'expense', description: '', frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10), nextExecutionDate: new Date().toISOString().slice(0, 10), active: true }); setOpen(true); }}>Add recurring</button></div></div>{rules.length ? <div className="recurring-list">{rules.map((rule) => <div className="recurring-item" key={rule.id}><div><strong>{rule.description || rule.category.name}</strong><span>{rule.frequency.toLowerCase()} · next {formatDate(rule.nextExecutionDate, true)} · {rule.active ? 'active' : 'inactive'}</span></div><div><span>{formatCurrency(rule.amount)}</span><button type="button" onClick={() => { setForm(rule); setOpen(true); }}>Edit</button><button type="button" className="danger-text" onClick={async () => { await deleteRecurringTransaction(rule.id); load(); showToast('Recurring rule deleted.', 'success'); }}>Delete</button></div></div>)}</div> : <p className="empty-desc">No recurring rules yet.</p>}{open && <div className="confirm-backdrop"><form className="confirm-dialog budget-form" role="dialog" aria-modal="true" aria-labelledby="recurring-rule-title" onSubmit={save}><h2 id="recurring-rule-title">{form.id ? 'Edit recurring rule' : 'Create recurring rule'}</h2><label>Description<input value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Frequency<select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label>Start date<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>Next occurrence<input type="date" value={form.nextExecutionDate} onChange={(event) => setForm({ ...form, nextExecutionDate: event.target.value })} /></label><label className="recurring-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Active</label><div><button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary">Save rule</button></div></form></div>}</section>;
}
