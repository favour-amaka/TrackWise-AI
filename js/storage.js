/**
 * TrackWise AI - Client-side Storage Manager
 * Uses LocalStorage to persist state, budgets, preferences, and details.
 */

const STORAGE_KEYS = {
  EXPENSES: 'trackwise_expenses',
  ONBOARDING_COMPLETED: 'trackwise_onboarding_completed',
  USER_PROFILE: 'trackwise_user_profile',
  BUDGET_GOALS: 'trackwise_budget_goals',
  NOTIFICATIONS: 'trackwise_notifications_logs'
};

const DEFAULT_USERS = [
  {
    name: 'Favour Marvellous',
    email: 'favourmarvellous920@gmail.com',
    password: 'password',
    income: 650000,
    currency: '₦',
    budget: 400000,
    expenses: [] // starts with custom set or base setup
  },
  {
    name: 'Demo Account',
    email: 'demo@trackwise.ai',
    password: 'password',
    income: 500000,
    currency: '$',
    budget: 300000,
    expenses: [] // filled with default template
  }
];

// Initial beautiful mock expenses representing naira-based start-up transactions
const DEFAULT_EXPENSES = [
  {
    id: 'exp_1',
    name: 'AWS Cloud Server Hosting',
    amount: 32000,
    category: 'Software & SaaS',
    date: '2026-05-18',
    paymentMethod: 'Corporate Visa Card',
    status: 'Completed',
    description: 'AWS billing for production clusters.'
  },
  {
    id: 'exp_2',
    name: 'Glo LTE Business Internet',
    amount: 15000,
    category: 'Utilities',
    date: '2026-05-20',
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    description: 'Monthly unlimited office high-speed internet subscription.'
  },
  {
    id: 'exp_3',
    name: 'Coworking Space Booking',
    amount: 120000,
    category: 'Rent & Office',
    date: '2026-05-10',
    paymentMethod: 'Zenith Direct Pay',
    status: 'Completed',
    description: 'Lagos office hub dedicated desks.'
  },
  {
    id: 'exp_4',
    name: 'Strategic Advisory Consultant',
    amount: 85000,
    category: 'Consulting & Legal',
    date: '2026-05-15',
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    description: 'Contractor review of intellectual property documentation.'
  },
  {
    id: 'exp_5',
    name: 'Uber For Business - Client Visit',
    amount: 8700,
    category: 'Transport',
    date: '2026-05-22',
    paymentMethod: 'Corporate Visa Card',
    status: 'Completed',
    description: 'Transport for marketing team heading to client pitch.'
  },
  {
    id: 'exp_6',
    name: 'Business Lunch with Partners',
    amount: 24500,
    category: 'Food & Dining',
    date: '2026-05-05',
    paymentMethod: 'Cash',
    status: 'Completed',
    description: 'Meal at Yellow Chilli restaurant with prospective associates.'
  },
  {
    id: 'exp_7',
    name: 'Vite Premium Themes Subscription',
    amount: 9800,
    category: 'Software & SaaS',
    date: '2026-05-12',
    paymentMethod: 'Verve Card',
    status: 'Pending',
    description: 'Annual subscription renewal for web templates library.'
  }
];

const DEFAULT_PROFILE = {
  name: 'Favour Marvellous',
  email: 'favourmarvellous920@gmail.com',
  currency: '₦',
  income: 650000,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

const DEFAULT_BUDGET_GOALS = {
  totalBudget: 400000,
  categoryBudgets: {
    'Software & SaaS': 80000,
    'Rent & Office': 150000,
    'Transport': 40000,
    'Food & Dining': 50000,
    'Utilities': 30000,
    'Consulting & Legal': 100000,
    'Other': 40000
  }
};

export class ExpenseStorage {
  static getExpenses() {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  }

  static saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    this.emitChange();
  }

  static addExpense(expense) {
    const expenses = this.getExpenses();
    const newExpense = {
      id: 'exp_' + Date.now(),
      status: expense.status || 'Completed',
      ...expense
    };
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);
    this.logNotification('New Expense Added', `"${newExpense.name}" has been recorded under ${newExpense.category}.`);
    return newExpense;
  }

  static updateExpense(id, updatedFields) {
    let expenses = this.getExpenses();
    expenses = expenses.map(exp => (exp.id === id ? { ...exp, ...updatedFields } : exp));
    this.saveExpenses(expenses);
    this.logNotification('Expense Updated', `Changes to "${updatedFields.name || 'Expense'}" saved successfully.`);
  }

  static deleteExpense(id) {
    const expenses = this.getExpenses();
    const item = expenses.find(exp => exp.id === id);
    const filtered = expenses.filter(exp => exp.id !== id);
    this.saveExpenses(filtered);
    if (item) {
      this.logNotification('Expense Deleted', `"${item.name}" was permanently offtaken from database.`);
    }
  }

  static duplicateExpense(id) {
    const expenses = this.getExpenses();
    const target = expenses.find(exp => exp.id === id);
    if (target) {
      const duplicate = {
        ...target,
        id: 'exp_' + Date.now(),
        name: `${target.name} (Copy)`,
        date: new Date().toISOString().split('T')[0] // duplicate as of today
      };
      expenses.unshift(duplicate);
      this.saveExpenses(expenses);
      this.logNotification('Expense Duplicated', `"${target.name}" cloned into a new transaction entry.`);
      return duplicate;
    }
    return null;
  }

  // Onboarding Completion Check
  static isOnboardingCompleted() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  }

  static setOnboardingCompleted(completed = true) {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
  }

  // Profile preferences
  static getUserProfile() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  }

  static saveUserProfile(profile) {
    const current = this.getUserProfile();
    const merged = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(merged));
    this.emitChange();
  }

  // Budget Goals setup
  static getBudgetGoals() {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET_GOALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BUDGET_GOALS, JSON.stringify(DEFAULT_BUDGET_GOALS));
      return DEFAULT_BUDGET_GOALS;
    }
    return JSON.parse(raw);
  }

  static saveBudgetGoals(goals) {
    localStorage.setItem(STORAGE_KEYS.BUDGET_GOALS, JSON.stringify(goals));
    this.emitChange();
  }

  // Notification logs for the dropdown in top right
  static getNotifications() {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      const initialNotes = [
        { id: 'not_1', title: 'System Setup Successful', content: 'TrackWise AI workspace initialized with local storage.', time: 'Just now', unread: true },
        { id: 'not_2', title: 'Smart Budget Alerts Active', content: 'You will receive warnings when categories exceed 80%.', time: '10m ago', unread: true }
      ];
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotes));
      return initialNotes;
    }
    return JSON.parse(raw);
  }

  static logNotification(title, content) {
    const notes = this.getNotifications();
    notes.unshift({
      id: 'not_' + Date.now(),
      title,
      content,
      time: 'Just now',
      unread: true
    });
    // Limit to 10 notifications
    if (notes.length > 10) notes.pop();
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notes));
  }

  static markAllNotificationsRead() {
    const notes = this.getNotifications();
    const updated = notes.map(n => ({ ...n, unread: false }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    this.emitChange();
  }

  // Reset Storage fully
  static resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_GOALS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    this.emitChange();
  }

  // Registered Users management
  static getUsers() {
    const raw = localStorage.getItem('trackwise_registered_users_v2');
    if (!raw) {
      // populate with mock base data (empty expenses as requested)
      const users = [
        {
          name: 'Favour Marvellous',
          email: 'favourmarvellous920@gmail.com',
          password: 'password',
          income: 650000,
          currency: '₦',
          budget: 400000,
          expenses: []
        },
        {
          name: 'Demo Account',
          email: 'demo@trackwise.ai',
          password: 'password',
          income: 500000,
          currency: '$',
          budget: 300000,
          expenses: []
        }
      ];
      localStorage.setItem('trackwise_registered_users_v2', JSON.stringify(users));
      // Clean up previous registration key if present
      localStorage.removeItem('trackwise_registered_users');
      return users;
    }
    return JSON.parse(raw);
  }

  static saveUsers(users) {
    localStorage.setItem('trackwise_registered_users_v2', JSON.stringify(users));
  }

  static getLoggedInUser() {
    return localStorage.getItem('trackwise_logged_in_user');
  }

  static syncCurrentUserToStorage() {
    const email = this.getLoggedInUser();
    if (!email) return;

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
      const activeExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || [];
      const activeProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) || {};
      const activeGoals = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET_GOALS)) || {};

      users[userIndex].expenses = activeExpenses;
      users[userIndex].name = activeProfile.name || users[userIndex].name;
      users[userIndex].income = Number(activeProfile.income || users[userIndex].income);
      users[userIndex].currency = activeProfile.currency || users[userIndex].currency;
      users[userIndex].budget = Number(activeGoals.totalBudget || users[userIndex].budget);
      if (activeProfile.password) {
        users[userIndex].password = activeProfile.password;
      }

      this.saveUsers(users);
    }
  }

  static login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('No account found with this email. Please Sign Up!');
    }
    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again!');
    }

    localStorage.setItem('trackwise_logged_in_user', user.email);

    // Load active localStorage structures
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(user.expenses || []));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
      name: user.name,
      email: user.email,
      currency: user.currency || '₦',
      income: Number(user.income || 650000),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      password: user.password
    }));
    localStorage.setItem(STORAGE_KEYS.BUDGET_GOALS, JSON.stringify({
      totalBudget: Number(user.budget || 400000),
      categoryBudgets: DEFAULT_BUDGET_GOALS.categoryBudgets
    }));
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');

    this.emitChange();
    return user;
  }

  static signup(name, email, password, income = 650000, currency = '₦', budget = 400000) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      name,
      email: email.toLowerCase(),
      password,
      income: Number(income),
      currency,
      budget: Number(budget),
      expenses: []
    };
    users.push(newUser);
    this.saveUsers(users);

    localStorage.setItem('trackwise_logged_in_user', newUser.email);

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newUser.expenses));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
      name: newUser.name,
      email: newUser.email,
      currency: newUser.currency,
      income: newUser.income,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      password: newUser.password
    }));
    localStorage.setItem(STORAGE_KEYS.BUDGET_GOALS, JSON.stringify({
      totalBudget: newUser.budget,
      categoryBudgets: DEFAULT_BUDGET_GOALS.categoryBudgets
    }));
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');

    this.emitChange();
    return newUser;
  }

  static logout() {
    this.syncCurrentUserToStorage();
    localStorage.removeItem('trackwise_logged_in_user');
    
    // Clear active keys to prepare for next clean session (otherwise old data may stay)
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_GOALS);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    
    const event = new Event('trackwise_data_changed');
    window.dispatchEvent(event);
  }

  // Observer system to redraw components instantly upon any data modification
  static emitChange() {
    this.syncCurrentUserToStorage();
    const event = new Event('trackwise_data_changed');
    window.dispatchEvent(event);
  }
}
