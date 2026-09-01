import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { CategoryIcon } from '../../utils/categoryIcons';
import { useApp } from '../../context/AppContext';
import { createTransaction, updateTransaction } from '../../services/transactionService';

const emptyForm = () => ({ categoryId: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '', type: 'expense' });

export default function TransactionModal({ isOpen, onClose, transaction }) {
  const { categories, refreshData, showToast } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(transaction ? { categoryId: transaction.categoryId, amount: transaction.amount, date: transaction.date, description: transaction.description || '', type: transaction.type } : emptyForm());
      setError('');
    }
  }, [isOpen, transaction]);

  if (!isOpen) return null;
  const submit = async (event) => {
    event.preventDefault();
    if (!form.categoryId || !form.amount || !form.date) return setError('Category, amount, and date are required.');
    setSaving(true);
    setError('');
    try {
      transaction ? await updateTransaction(transaction.id, form) : await createTransaction(form);
      refreshData();
      showToast(transaction ? 'Transaction updated.' : 'Transaction added.', 'success');
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const requiredFieldError = (value) => Boolean(error && !value);

  return <div className="modal-overlay show" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
      <div className="modal-header"><div id="transaction-modal-title" className="modal-title">{transaction ? 'Edit Transaction' : 'Add Transaction'}</div><button type="button" className="modal-close" aria-label="Close transaction form" onClick={onClose}><X size={17} strokeWidth={2} /></button></div>
      <div className="type-toggle" aria-label="Transaction type">{['expense', 'income'].map((type) => <button key={type} type="button" aria-pressed={form.type === type} className={`type-btn ${form.type === type ? `active-${type}` : ''}`} onClick={() => setForm({ ...form, type })}>{type === 'expense' ? <ArrowDownLeft size={16} strokeWidth={1.9} /> : <ArrowUpRight size={16} strokeWidth={1.9} />}{type === 'expense' ? 'Expense' : 'Income'}</button>)}</div>
      <form className="modal-form" onSubmit={submit}>
        <label><span className="modal-label">Description</span><input className="modal-input" value={form.description} placeholder="e.g. Grocery shopping" onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="form-row"><label><span className="modal-label">Amount (₹)</span><input className="modal-input" type="number" min="0.01" step="0.01" value={form.amount} aria-invalid={requiredFieldError(form.amount)} aria-describedby={requiredFieldError(form.amount) ? 'transaction-form-error' : undefined} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label><span className="modal-label">Date</span><input className="modal-input" type="date" value={form.date} aria-invalid={requiredFieldError(form.date)} aria-describedby={requiredFieldError(form.date) ? 'transaction-form-error' : undefined} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label></div>
        <label><span className="modal-label">Category</span><select className="modal-input" value={form.categoryId} aria-invalid={requiredFieldError(form.categoryId)} aria-describedby={requiredFieldError(form.categoryId) ? 'transaction-form-error' : undefined} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        {error && <p id="transaction-form-error" className="form-error show" role="alert">{error}</p>}
        <button className="modal-submit" disabled={saving}>{saving ? 'Saving…' : transaction ? 'Save Changes' : 'Add Transaction'}</button>
      </form>
    </div>
  </div>;
}
