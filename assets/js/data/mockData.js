// mockData.js — fake data until backend is ready
// When backend is done, this file gets removed and replaced with API calls

const MOCK_USER = {
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  initials: 'AS',
  joinedDate: '2024-01-01',
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Rent', 'Health', 'Entertainment', 'Savings', 'Utilities'];

const MOCK_TRANSACTIONS = [
  { id: 1,  title: 'Swiggy Order',         category: 'Food',          amount: -340,   date: '2025-05-15', type: 'expense', recurring: false },
  { id: 2,  title: 'Salary Credit',        category: 'Savings',       amount: 55000,  date: '2025-05-01', type: 'income',  recurring: true  },
  { id: 3,  title: 'Ola Cab',              category: 'Transport',     amount: -210,   date: '2025-05-14', type: 'expense', recurring: false },
  { id: 4,  title: 'Netflix Subscription', category: 'Entertainment', amount: -649,   date: '2025-05-05', type: 'expense', recurring: true  },
  { id: 5,  title: 'Zomato',              category: 'Food',          amount: -180,   date: '2025-05-13', type: 'expense', recurring: false },
  { id: 6,  title: 'Electricity Bill',    category: 'Utilities',     amount: -1200,  date: '2025-05-08', type: 'expense', recurring: true  },
  { id: 7,  title: 'Amazon Purchase',     category: 'Shopping',      amount: -2499,  date: '2025-05-11', type: 'expense', recurring: false },
  { id: 8,  title: 'Gym Membership',      category: 'Health',        amount: -1500,  date: '2025-05-03', type: 'expense', recurring: true  },
  { id: 9,  title: 'Freelance Payment',   category: 'Savings',       amount: 12000,  date: '2025-05-10', type: 'income',  recurring: false },
  { id: 10, title: 'House Rent',          category: 'Rent',          amount: -15000, date: '2025-05-01', type: 'expense', recurring: true  },
  { id: 11, title: 'Blinkit Groceries',   category: 'Food',          amount: -870,   date: '2025-05-12', type: 'expense', recurring: false },
  { id: 12, title: 'Metro Card Recharge', category: 'Transport',     amount: -500,   date: '2025-05-07', type: 'expense', recurring: false },
  { id: 13, title: 'Doctor Visit',        category: 'Health',        amount: -800,   date: '2025-05-09', type: 'expense', recurring: false },
  { id: 14, title: 'Spotify',             category: 'Entertainment', amount: -119,   date: '2025-05-05', type: 'expense', recurring: true  },
  { id: 15, title: 'Referral Bonus',      category: 'Savings',       amount: 500,    date: '2025-05-06', type: 'income',  recurring: false },
];

const MOCK_BUDGETS = [
  { category: 'Food',          limit: 3000,  spent: 1390  },
  { category: 'Transport',     limit: 1500,  spent: 710   },
  { category: 'Shopping',      limit: 3000,  spent: 2499  },
  { category: 'Rent',          limit: 16000, spent: 15000 },
  { category: 'Health',        limit: 2000,  spent: 2300  },
  { category: 'Entertainment', limit: 1000,  spent: 768   },
  { category: 'Utilities',     limit: 1500,  spent: 1200  },
];

const MOCK_MONTHLY = [
  { month: 'Nov', income: 55000, expense: 18400 },
  { month: 'Dec', income: 58000, expense: 22100 },
  { month: 'Jan', income: 55000, expense: 19800 },
  { month: 'Feb', income: 67000, expense: 21300 },
  { month: 'Mar', income: 55000, expense: 20100 },
  { month: 'Apr', income: 55000, expense: 24500 },
  { month: 'May', income: 67500, expense: 23517 },
];

// helpers
function getTotalIncome() {
  return MOCK_TRANSACTIONS
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

function getTotalExpense() {
  return MOCK_TRANSACTIONS
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function getBalance() {
  return getTotalIncome() - getTotalExpense();
}

function formatCurrency(amount) {
  return '₹' + Math.abs(amount).toLocaleString('en-IN');
}