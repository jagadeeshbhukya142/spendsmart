// transactions.js
// day 4 -- full transaction table with search and filters
// all filtering happens in the browser using the mock data
// later this will call GET /api/transactions with query params

document.addEventListener('DOMContentLoaded', () => {
    renderSummaryStrip();
    renderTable(MOCK_TRANSACTIONS);
    setupFilters();
    setupModal();
    setupExport();

    // update badge count in sidebar
    const badge = document.getElementById('txnCount');
    if (badge) badge.textContent = MOCK_TRANSACTIONS.length;
});


// ---- SUMMARY STRIP ----
// 3 quick numbers at the top of the page

function renderSummaryStrip() {
    const container = document.getElementById('txnSummaryStrip');
    if (!container) return;

    const totalIncome  = getTotalIncome();
    const totalExpense = getTotalExpense();
    const txnCount     = MOCK_TRANSACTIONS.length;

    container.innerHTML = `
        <div class="strip-card">
            <div class="strip-icon green">💵</div>
            <div class="strip-info">
                <div class="strip-label">Total Income</div>
                <div class="strip-value">${formatCurrency(totalIncome)}</div>
            </div>
        </div>
        <div class="strip-card">
            <div class="strip-icon red">💸</div>
            <div class="strip-info">
                <div class="strip-label">Total Expenses</div>
                <div class="strip-value">${formatCurrency(totalExpense)}</div>
            </div>
        </div>
        <div class="strip-card">
            <div class="strip-icon blue">🧾</div>
            <div class="strip-info">
                <div class="strip-label">Transactions</div>
                <div class="strip-value">${txnCount}</div>
            </div>
        </div>
    `;
}


// ---- RENDER TABLE ----
// takes an array of transactions and builds the table rows
// called every time filters change

function renderTable(data) {
    const tbody     = document.getElementById('txnTableBody');
    const emptyState = document.getElementById('emptyState');
    const resultsInfo = document.getElementById('resultsInfo');

    if (!tbody) return;

    // update results count text
    if (resultsInfo) {
        const total = MOCK_TRANSACTIONS.length;
        if (data.length === total) {
            resultsInfo.innerHTML = `Showing all <span>${total}</span> transactions`;
        } else {
            resultsInfo.innerHTML = `Showing <span>${data.length}</span> of ${total} transactions`;
        }
    }

    // show empty state if nothing matches
    if (data.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const categoryIcons = {
        'Food': '🍔', 'Transport': '🚗', 'Shopping': '🛍️',
        'Rent': '🏠', 'Health': '💊', 'Entertainment': '🎬',
        'Utilities': '💡', 'Savings': '🏦'
    };

    tbody.innerHTML = data.map(t => {
        const isIncome = t.type === 'income';
        const icon = categoryIcons[t.category] || '💳';
        const amountDisplay = (isIncome ? '+' : '-') + formatCurrency(t.amount);
        const dateDisplay = new Date(t.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return `
            <tr>
                <td>
                    <div class="txn-name-cell">
                        <div class="txn-table-icon">${icon}</div>
                        <div>
                            <div class="txn-table-name">
                                ${t.title}
                                ${t.recurring
                                    ? '<span class="recurring-badge">recurring</span>'
                                    : ''}
                            </div>
                            <div class="txn-table-sub">${dateDisplay}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="category-pill">${icon} ${t.category}</span>
                </td>
                <td style="color:var(--clr-text-muted); font-size:0.82rem;">
                    ${dateDisplay}
                </td>
                <td>
                    <span class="type-badge ${isIncome ? 'income' : 'expense'}">
                        ${isIncome ? 'Income' : 'Expense'}
                    </span>
                </td>
                <td class="txn-amount-cell ${isIncome ? 'credit' : 'debit'}">
                    ${amountDisplay}
                </td>
            </tr>
        `;
    }).join('');
}


// ---- FILTERS ----
// runs every time any filter or search input changes
// i filter the array first then pass to renderTable

function setupFilters() {
    const searchInput    = document.getElementById('searchInput');
    const searchClear    = document.getElementById('searchClear');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter     = document.getElementById('typeFilter');
    const sortFilter     = document.getElementById('sortFilter');
    const clearBtn       = document.getElementById('clearFilters');

    // show/hide the X button in search
    searchInput.addEventListener('input', () => {
        searchClear.classList.toggle('show', searchInput.value.length > 0);
        applyFilters();
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('show');
        applyFilters();
    });

    categoryFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        typeFilter.value = '';
        sortFilter.value = 'date-desc';
        searchClear.classList.remove('show');
        applyFilters();
        showToast('Filters cleared', 'info');
    });
}
// not 100% sure this is the best way to sort but it works
// will look into localeCompare later for string sorting

function applyFilters() {
    const search   = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const type     = document.getElementById('typeFilter').value;
    const sort     = document.getElementById('sortFilter').value;

    // start with all transactions then narrow down
    let filtered = [...MOCK_TRANSACTIONS];

    // search filter -- checks title and category
    if (search) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(search) ||
            t.category.toLowerCase().includes(search)
        );
    }

    // category filter
    if (category) {
        filtered = filtered.filter(t => t.category === category);
    }

    // type filter
    if (type) {
        filtered = filtered.filter(t => t.type === type);
    }

    // sorting
    // not 100% sure this is the best way to sort but it works
    filtered.sort((a, b) => {
        if (sort === 'date-desc')   return new Date(b.date) - new Date(a.date);
        if (sort === 'date-asc')    return new Date(a.date) - new Date(b.date);
        if (sort === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount);
        if (sort === 'amount-asc')  return Math.abs(a.amount) - Math.abs(b.amount);
        return 0;
    });

    renderTable(filtered);
}


// ---- MODAL ----
// same logic as dashboard modal

function setupModal() {
    const overlay  = document.getElementById('addTxModal');
    const closeBtn = document.getElementById('modalClose');
    const form     = document.getElementById('txForm');
    const typeBtns = document.querySelectorAll('.type-btn');

    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    closeBtn.addEventListener('click', closeModal);

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active-expense','active-income'));
            const t = btn.dataset.type;
            btn.classList.add(t === 'expense' ? 'active-expense' : 'active-income');
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title    = document.getElementById('txTitle').value.trim();
        const amount   = parseFloat(document.getElementById('txAmount').value);
        const category = document.getElementById('txCategory').value;
        const date     = document.getElementById('txDate').value;
        const activeBtn = document.querySelector('.type-btn.active-expense, .type-btn.active-income');
        const type     = activeBtn ? activeBtn.dataset.type : 'expense';

        if (!title || !amount || !category || !date) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        MOCK_TRANSACTIONS.unshift({
            id: Date.now(),
            title, category,
            amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
            date, type,
            recurring: document.getElementById('txRecurring').checked
        });

        showToast('Transaction added ✅', 'success');
        closeModal();
        form.reset();

        // re-render with new data
        renderSummaryStrip();
        applyFilters();

        // update badge
        const badge = document.getElementById('txnCount');
        if (badge) badge.textContent = MOCK_TRANSACTIONS.length;
    });

    const dateInput = document.getElementById('txDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function closeModal() {
    document.getElementById('addTxModal').classList.remove('show');
}

window.openAddTxModal = () => {
    document.getElementById('addTxModal').classList.add('show');
};


// ---- CSV EXPORT ----
// converts the current filtered data to CSV and downloads it
// no library needed -- pure JS

function setupExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        // get currently filtered data
        const search   = document.getElementById('searchInput').value.toLowerCase().trim();
        const category = document.getElementById('categoryFilter').value;
        const type     = document.getElementById('typeFilter').value;

        let data = [...MOCK_TRANSACTIONS];
        if (search)   data = data.filter(t => t.title.toLowerCase().includes(search));
        if (category) data = data.filter(t => t.category === category);
        if (type)     data = data.filter(t => t.type === type);

        if (data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        // build CSV string
        const headers = ['Title', 'Category', 'Amount', 'Type', 'Date', 'Recurring'];
        const rows = data.map(t => [
            t.title,
            t.category,
            Math.abs(t.amount),
            t.type,
            t.date,
            t.recurring ? 'Yes' : 'No'
        ]);

        const csv = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        // trigger download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'spendsmart-transactions.csv';
        a.click();
        URL.revokeObjectURL(url);

        showToast(`Exported ${data.length} transactions ✅`, 'success');
    });
}