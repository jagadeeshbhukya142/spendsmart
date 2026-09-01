export const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

export const formatDate = (date, includeYear = false) => new Date(`${date}T00:00:00`).toLocaleDateString(
  'en-IN',
  { day: 'numeric', month: 'short', ...(includeYear ? { year: 'numeric' } : {}) },
);
