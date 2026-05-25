document.addEventListener('DOMContentLoaded', () => {

    renderSummaryCards();
    renderRecentTransactions();
    renderBudgetStrip();
    setupModal();
    setGreeting();

    // day 3 -- real charts
    renderBarChart();
    renderPieChart();
    setupChartTabs();
});


// ---- SUMMARY CARDS ----
// calculating totals from mockData and injecting into the cards

function renderSummaryCards() {
    const income  = getTotalIncome();
    const expense = getTotalExpense();
    const balance = getBalance();
    // savings = whatever is left after expenses
    const savings = income - expense;

    const cards = [
        {
            id: 'incomeCard',
            label: 'Total Income',
            amount: formatCurrency(income),
            icon: '💵',
            iconClass: 'green',
            cardClass: 'income',
            change: '↑ 12.4%',
            changeClass: 'up',
            note: 'vs last month'
        },
        {
            id: 'expenseCard',
            label: 'Total Expenses',
            amount: formatCurrency(expense),
            icon: '💸',
            iconClass: 'red',
            cardClass: 'expense',
            change: '↑ 4.2%',
            changeClass: 'down',
            note: 'vs last month'
        },
        {
            id: 'savingsCard',
            label: 'Net Savings',
            amount: formatCurrency(savings),
            icon: '🏦',
            iconClass: 'blue',
            cardClass: 'savings',
            change: savings > 0 ? '↑ Good' : '↓ Low',
            changeClass: savings > 0 ? 'up' : 'down',
            note: 'this month'
        },
        {
            id: 'balanceCard',
            label: 'Balance',
            amount: formatCurrency(balance),
            icon: '💰',
            iconClass: 'yellow',
            cardClass: 'balance',
            change: '↗ Stable',
            changeClass: 'neutral',
            note: 'overall'
        },
    ];

    const grid = document.getElementById('summaryGrid');
    if (!grid) return;

    grid.innerHTML = cards.map(c => `
        <div class="summary-card ${c.cardClass}">
            <div class="card-top">
                <span class="card-label">${c.label}</span>
                <div class="card-icon ${c.iconClass}">${c.icon}</div>
            </div>
            <div class="card-amount">${c.amount}</div>
            <div class="card-change ${c.changeClass}">
                ${c.change} <span style="color:var(--clr-text-dim)">${c.note}</span>
            </div>
        </div>
    `).join('');
}


// ---- RECENT TRANSACTIONS ----
// showing only the last 7 transactions, sorted by date

function renderRecentTransactions() {
    const list = document.getElementById('recentTxnList');
    if (!list) return;

    // only last 7 for the dashboard -- full list is on transactions page
    // spread operator so the original array doesnt get sorted and messed up
    // took me some time to figure this out
    const recent = [...MOCK_TRANSACTIONS]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);

    const categoryIcons = {
        'Food':          '🍔',
        'Transport':     '🚗',
        'Shopping':      '🛍️',
        'Rent':          '🏠',
        'Health':        '💊',
        'Entertainment': '🎬',
        'Savings':       '🏦',
        'Utilities':     '💡',
    };

    list.innerHTML = recent.map(t => {
        const isCredit = t.type === 'income';
        const icon = categoryIcons[t.category] || '💳';
        const amountDisplay = (isCredit ? '+' : '-') + formatCurrency(t.amount);
        // format the date nicely -- not sure if there's a cleaner way
        const dateDisplay = new Date(t.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short'
        });

        return `
            <div class="txn-item">
                <div class="txn-icon">${icon}</div>
                <div class="txn-details">
                    <div class="txn-name">
                        ${t.title}
                        ${t.recurring ? '<span class="recurring-badge">recurring</span>' : ''}
                    </div>
                    <div class="txn-category">${t.category}</div>
                </div>
                <div class="txn-right">
                    <div class="txn-amount ${isCredit ? 'credit' : 'debit'}">${amountDisplay}</div>
                    <div class="txn-date">${dateDisplay}</div>
                </div>
            </div>
        `;
    }).join('');
}


// ---- BUDGET STRIP ----
// showing 4 budget categories at the bottom of dashboard

function renderBudgetStrip() {
    const container = document.getElementById('budgetItems');
    if (!container) return;

    // only showing first 4 on dashboard -- full list on budget page
    const visible = MOCK_BUDGETS.slice(0, 4);

    const categoryIcons = {
        'Food': '🍔', 'Transport': '🚗',
        'Shopping': '🛍️', 'Rent': '🏠',
        'Health': '💊', 'Entertainment': '🎬',
        'Utilities': '💡'
    };

    container.innerHTML = visible.map(b => {
        const pct = Math.round((b.spent / b.limit) * 100);
        // colour logic -- green until 75%, yellow until 90%, red after
        const fillClass = pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'safe';
        const pctColor  = pct >= 90 ? '#ff6b6b' : pct >= 75 ? '#ffb347' : '#00c896';
        const icon = categoryIcons[b.category] || '💳';

        return `
            <div class="budget-item">
                <div class="budget-item-top">
                    <span class="budget-cat">${icon} ${b.category}</span>
                    <span class="budget-pct" style="color:${pctColor}">${pct}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${fillClass}" style="width: ${Math.min(pct, 100)}%"></div>
                </div>
                <div class="budget-amounts">${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}</div>
            </div>
        `;
    }).join('');
}


// ---- BAR CHART ----
// took me a while to understand the datasets structure
// income and expense are two separate datasets on same chart

let barChartInstance = null;

function renderBarChart() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    // get labels and data from mockData
    const labels  = MOCK_MONTHLY.map(m => m.month);
    const incomes  = MOCK_MONTHLY.map(m => m.income);
    const expenses = MOCK_MONTHLY.map(m => m.expense);

    // destroy old chart before making new one
    // without this it throws an error on re-render
    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomes,
                    backgroundColor: 'rgba(0, 200, 150, 0.75)',
                    borderColor: 'rgba(0, 200, 150, 1)',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Expenses',
                    data: expenses,
                    backgroundColor: 'rgba(255, 107, 107, 0.75)',
                    borderColor: 'rgba(255, 107, 107, 1)',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                               .getPropertyValue('--clr-text').trim() || '#e8eaf0',
                        font: { size: 12, family: 'DM Sans' },
                        boxWidth: 12,
                        padding: 16,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ' ₹' + ctx.raw.toLocaleString('en-IN')
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                               .getPropertyValue('--clr-text-muted').trim() || '#7a8099'
                    }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                               .getPropertyValue('--clr-text-muted').trim() || '#7a8099',
                        callback: (val) => '₹' + (val/1000) + 'k'
                    }
                }
            }
        }
    });
}


// ---- PIE CHART ----
// this shows spending breakdown by category
// i had to manually calculate totals per category from the transactions

let pieChartInstance = null;

function renderPieChart() {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    // group expenses by category
    // i didnt know you could use an object like this to group data
    // much cleaner than what i was trying before with if-else
    const categoryTotals = {};
    MOCK_TRANSACTIONS.forEach(t => {
        if (t.type === 'expense') {
            const cat = t.category;
            const amt = Math.abs(t.amount);
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
        }
    });

    const labels  = Object.keys(categoryTotals);
    const data    = Object.values(categoryTotals);
    const total   = data.reduce((a, b) => a + b, 0);

    // colours for each slice
    const colors = [
        '#00c896', '#ff6b6b', '#4e9af1',
        '#ffb347', '#a78bfa', '#34d399',
        '#f472b6', '#60a5fa'
    ];

    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'transparent',
                borderWidth: 0,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const pct = Math.round((ctx.raw / total) * 100);
                            return ` ₹${ctx.raw.toLocaleString('en-IN')} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // render custom legend separately
    renderPieLegend(labels, data, colors, total);
}


// custom legend -- chart.js built-in legend didnt look good
// so i made my own with the percentage badges

function renderPieLegend(labels, data, colors, total) {
    const container = document.getElementById('pieLegend');
    if (!container) return;

    container.innerHTML = labels.map((label, i) => {
        const pct = Math.round((data[i] / total) * 100);
        return `
            <div class="legend-item">
                <div class="legend-dot" style="background:${colors[i]}"></div>
                <span class="legend-name">${label}</span>
                <span class="legend-amount">${formatCurrency(data[i])}</span>
                <span class="legend-pct">${pct}%</span>
            </div>
        `;
    }).join('');
}


// ---- CHART TAB SWITCHING ----
// when user clicks 3M or 1M, filter the data and re-render

function setupChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const range = tab.dataset.range;
            let months = 7;
            if (range === '3m') months = 3;
            if (range === '1m') months = 1;

            // slice data based on selected range
            const sliced = MOCK_MONTHLY.slice(-months);
            updateBarChart(sliced);
        });
    });
}

function updateBarChart(data) {
    if (!barChartInstance) return;

    barChartInstance.data.labels   = data.map(m => m.month);
    barChartInstance.data.datasets[0].data = data.map(m => m.income);
    barChartInstance.data.datasets[1].data = data.map(m => m.expense);
    barChartInstance.update();
}

// ---- MODAL ----
// add transaction modal logic

function setupModal() {
    const overlay  = document.getElementById('addTxModal');
    const closeBtn = document.getElementById('modalClose');
    const form     = document.getElementById('txForm');
    const typeBtns = document.querySelectorAll('.type-btn');

    if (!overlay) return;

    // close when clicking overlay background
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    closeBtn.addEventListener('click', closeModal);

    // type toggle -- expense / income
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active-expense', 'active-income'));
            const t = btn.dataset.type;
            btn.classList.add(t === 'expense' ? 'active-expense' : 'active-income');
        });
    });

    // form submit -- just adds to mock array for now
    // TODO later: replace with POST /api/transactions
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title    = document.getElementById('txTitle').value.trim();
        const amount   = parseFloat(document.getElementById('txAmount').value);
        const category = document.getElementById('txCategory').value;
        const date     = document.getElementById('txDate').value;
        const activeTypeBtn = document.querySelector('.type-btn.active-expense, .type-btn.active-income');
        const type     = activeTypeBtn ? activeTypeBtn.dataset.type : 'expense';

        if (!title || !amount || !category || !date) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        // push to the mock array -- this will be API call later
        MOCK_TRANSACTIONS.unshift({
            id: Date.now(),
            title,
            category,
            amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
            date,
            type,
            recurring: document.getElementById('txRecurring').checked
        });

        showToast('Transaction added! ✅', 'success');
        closeModal();
        form.reset();

        // re-render everything with new data
        renderSummaryCards();
        renderRecentTransactions();
    });

    // set today's date as default in the date input
    const dateInput = document.getElementById('txDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function closeModal() {
    document.getElementById('addTxModal').classList.remove('show');
}

// expose openModal globally so the button in HTML can call it
window.openAddTxModal = () => {
    document.getElementById('addTxModal').classList.add('show');
};


// ---- GREETING ----
// changes based on time of day -- small touch but looks nice

function setGreeting() {
    const hour = new Date().getHours();
    const greetEl = document.getElementById('greetingText');
    if (!greetEl) return;

    let greet = 'Good morning';
    if (hour >= 12 && hour < 17) greet = 'Good afternoon';
    if (hour >= 17)              greet = 'Good evening';

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    greetEl.textContent = `${greet} 👋 — ${dateStr}`;
}

// call on load
setGreeting();


// ---- MOBILE MENU ----
// show the hamburger button only on small screens

function setupMobileMenu() {
    const menuBtn = document.getElementById('menuToggle');
    if (window.innerWidth <= 768 && menuBtn) {
        menuBtn.style.display = 'flex';
    }
}

setupMobileMenu();
window.addEventListener('resize', setupMobileMenu);