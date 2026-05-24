/**
 * TrackWise AI - Core Application Orchestrator
 * Integrates storage mechanisms, SVG analytic renderings, AI chatbot advisor logic, and interactive layout elements.
 * Adheres strictly to the premium 2026 SaaS fintech specifications.
 */

import { ExpenseStorage } from './storage.js';
import { AnalyticsEngine } from './analytics.js';
import { ChatBot } from './chat.js';

class AppController {
  constructor() {
    this.analytics = new AnalyticsEngine();
    this.chatbot = null;

    // Filter, Sorting and Pagination state variables
    this.filterState = {
      search: '',
      category: 'All',
      dateRange: 'All', // All, Today, Last7, Last30
      sortField: 'date', // date, amount, name
      sortAsc: false,
      currentPage: 1,
      itemsPerPage: 5
    };

    this.activeExpenseIdForEdit = null;
    this.theme = 'dark';
    this.currencyPrefix = '₦';
  }

  init() {
    // Set up auth first!
    this.setupAuthListeners();
    const isAuthenticated = this.checkAuth();

    // 1. Initial State Checks & Setup
    if (isAuthenticated) {
      this.checkOnboarding();
      this.applyLoadedPreferences();
    }
    this.setupTheme();

    // 2. Initialize Charts
    const chartContainers = {
      pie: document.getElementById('chart-pie-container'),
      bar: document.getElementById('chart-bar-container'),
      line: document.getElementById('chart-line-container')
    };
    this.analytics.init(chartContainers);

    // 3. Initialize AI Chatbot System
    const chatbotElements = {
      messages: document.getElementById('chat-messages'),
      typing: document.getElementById('chat-typing'),
      input: document.getElementById('chat-input'),
      btn: document.getElementById('chat-send-btn'),
      quickActions: document.querySelectorAll('.quick-action-pill')
    };
    this.chatbot = new ChatBot(
      chatbotElements.messages,
      chatbotElements.typing,
      chatbotElements.input,
      chatbotElements.btn,
      chatbotElements.quickActions
    );
    this.chatbot.init();

    // 4. Attach General Listeners
    this.attachDomListeners();
    this.attachShortcuts();

    // 5. Build Dynamic Insights and Tables
    if (isAuthenticated) {
      this.refreshDashboardData();
    }

    // Redraw whenever storage changes internally
    window.addEventListener('trackwise_data_changed', () => {
      const authOk = this.checkAuth();
      if (authOk) {
        this.applyLoadedPreferences();
        this.checkOnboarding();
        this.refreshDashboardData();
      }
    });

    // Animate Loading Skeletons
    if (isAuthenticated) {
      this.simulateSkeletonLoad();
    }
  }

  checkAuth() {
    const loggedInEmail = ExpenseStorage.getLoggedInUser();
    const authScreen = document.getElementById('auth-screen');
    
    if (!loggedInEmail) {
      if (authScreen) {
        authScreen.classList.remove('hidden');
        authScreen.classList.add('flex');
      }
      return false;
    } else {
      if (authScreen) {
        authScreen.classList.add('hidden');
        authScreen.classList.remove('flex');
      }
      return true;
    }
  }

  setupAuthListeners() {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const containerFullName = document.getElementById('auth-fullname-container');
    const inputFullName = document.getElementById('auth-fullname');
    const signupFields = document.getElementById('auth-signup-fields');
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnText = document.getElementById('auth-submit-btn-text');
    const form = document.getElementById('auth-form');
    const errAlert = document.getElementById('auth-error-alert');
    const errText = document.getElementById('auth-error-text');
    
    let isLoginTab = true;
    
    if (tabLogin && tabSignup) {
      tabLogin.addEventListener('click', () => {
        if (isLoginTab) return;
        isLoginTab = true;
        
        tabLogin.className = 'flex-1 py-1.5 text-xs font-bold text-white rounded-lg bg-white/10 transition-all cursor-pointer';
        tabSignup.className = 'flex-1 py-1.5 text-xs font-bold text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer';
        
        if (containerFullName) containerFullName.classList.add('hidden');
        if (inputFullName) {
          inputFullName.removeAttribute('required');
          inputFullName.value = '';
        }
        if (signupFields) signupFields.classList.add('hidden');
        
        if (title) title.textContent = 'Welcome Back';
        if (subtitle) subtitle.textContent = 'Sign in to access your custom visual expense analytics and financial models.';
        if (btnText) btnText.textContent = 'Log In To Console';
        if (errAlert) errAlert.classList.add('hidden');
      });
      
      tabSignup.addEventListener('click', () => {
        if (!isLoginTab) return;
        isLoginTab = false;
        
        tabSignup.className = 'flex-1 py-1.5 text-xs font-bold text-white rounded-lg bg-white/10 transition-all cursor-pointer';
        tabLogin.className = 'flex-1 py-1.5 text-xs font-bold text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer';
        
        if (containerFullName) containerFullName.classList.remove('hidden');
        if (inputFullName) inputFullName.setAttribute('required', 'true');
        if (signupFields) signupFields.classList.remove('hidden');
        
        if (title) title.textContent = 'Create Your Free Account';
        if (subtitle) subtitle.textContent = 'Get started with the model forecasting platform and smart bookkeeping system in minutes.';
        if (btnText) btnText.textContent = 'Create New Account';
        if (errAlert) errAlert.classList.add('hidden');
      });
    }
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        
        if (errAlert) errAlert.classList.add('hidden');
        
        try {
          if (isLoginTab) {
            // LOGIN FLOW
            ExpenseStorage.login(email, password);
            this.showToast('Access Authorized', 'Successfully mounted user interface shell.', 'success');
          } else {
            // SIGN UP FLOW
            const name = inputFullName ? inputFullName.value.trim() : '';
            const income = parseFloat(document.getElementById('auth-income').value) || 650000;
            const currency = document.getElementById('auth-currency').value;
            const budget = parseFloat(document.getElementById('auth-budget').value) || 400000;
            
            if (!name) {
              throw new Error('Please enter your full name for credentials.');
            }
            if (!email) {
              throw new Error('Please enter a valid email address.');
            }
            if (!password || password.length < 4) {
              throw new Error('Password must be at least 4 characters long.');
            }
            
            ExpenseStorage.signup(name, email, password, income, currency, budget);
            this.showToast('Account Created', 'Successfully established custom bookkeeping slot.', 'success');
          }
        } catch (error) {
          if (errAlert && errText) {
            errText.textContent = error.message;
            errAlert.classList.remove('hidden');
          }
          this.showToast('Authentication Error', error.message, 'danger');
        }
      });
    }

    // Attach Log Out actions dynamically
    const headerLogout = document.getElementById('profile-signout');
    const sidebarLogout = document.getElementById('sidebar-logout-btn');

    if (headerLogout) {
      headerLogout.addEventListener('click', () => {
        ExpenseStorage.logout();
        this.showToast('Session Expired', 'User session terminated. Content stack unmounted.', 'info');
      });
    }

    if (sidebarLogout) {
      sidebarLogout.addEventListener('click', () => {
        ExpenseStorage.logout();
        this.showToast('Session Expired', 'User session terminated. Content stack unmounted.', 'info');
      });
    }
  }

  checkOnboarding() {
    const isCompleted = ExpenseStorage.isOnboardingCompleted();
    const overlay = document.getElementById('onboarding-screen');
    if (!isCompleted && overlay) {
      overlay.classList.remove('hidden-onboarding');
      overlay.classList.add('flex');
    } else if (overlay) {
      overlay.classList.add('hidden-onboarding');
      overlay.classList.remove('flex');
    }
  }

  applyLoadedPreferences() {
    const profile = ExpenseStorage.getUserProfile();
    this.currencyPrefix = profile.currency || '₦';

    // Update displays
    document.querySelectorAll('.user-display-name').forEach(el => {
      el.textContent = profile.name || 'Favour Marvellous';
    });
    document.querySelectorAll('.user-display-avatar').forEach(el => {
      if (el.tagName === 'IMG') {
        el.src = profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      }
    });

    // Sync input fields inside profiles
    const profNameInput = document.getElementById('pref-user-name');
    const profIncomeInput = document.getElementById('pref-monthly-income');
    const profCurrencyInput = document.getElementById('pref-currency');
    const profBudgetInput = document.getElementById('pref-total-budget');
    const profPasswordInput = document.getElementById('pref-user-password');

    if (profNameInput) profNameInput.value = profile.name;
    if (profIncomeInput) profIncomeInput.value = profile.income;
    if (profCurrencyInput) profCurrencyInput.value = profile.currency;
    if (profPasswordInput) profPasswordInput.value = profile.password || '';

    const goals = ExpenseStorage.getBudgetGoals();
    if (profBudgetInput) profBudgetInput.value = goals.totalBudget;
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('trackwise_theme') || 'dark';
    this.theme = savedTheme;
    const body = document.body;
    const icon = document.getElementById('theme-toggle-icon');

    if (savedTheme === 'light') {
      body.classList.add('light-theme');
      body.classList.remove('dark');
      if (icon) {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />`;
      }
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark');
      if (icon) {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5l-1.5 1.5M6.5 17.5L5 19M19 19l-1.5-1.5M6.5 6.5l1.5 1.5M12 8a4 4 0 100 8 4 4 0 000-8z" />`;
      }
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('trackwise_theme', this.theme);
    this.setupTheme();
    this.showToast('Theme Updated', `Switched to ${this.theme} user profile layout.`, 'info');
  }

  simulateSkeletonLoad() {
    const content = document.querySelectorAll('.main-card-data');
    const skeletons = document.querySelectorAll('.main-skeleton-data');

    skeletons.forEach(s => s.classList.remove('hidden'));
    content.forEach(c => c.classList.add('hidden'));

    setTimeout(() => {
      skeletons.forEach(s => s.classList.add('hidden'));
      content.forEach(c => c.classList.remove('hidden'));
    }, 1200);
  }

  attachDomListeners() {
    // 1. Onboarding actions
    const completeOnboardingBtn = document.getElementById('submit-onboarding-btn');
    if (completeOnboardingBtn) {
      completeOnboardingBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('onboard-name');
        const budgetInput = document.getElementById('onboard-budget');
        const currencyInput = document.getElementById('onboard-currency');

        const name = nameInput ? nameInput.value.trim() : '';
        const budget = budgetInput ? Number(budgetInput.value) : 400000;
        const currency = currencyInput ? currencyInput.value : '₦';

        if (!name) {
          nameInput.closest('.form-field').classList.add('shake-element');
          setTimeout(() => nameInput.closest('.form-field').classList.remove('shake-element'), 500);
          return;
        }

        // Save preferences
        ExpenseStorage.saveUserProfile({ name, currency });
        ExpenseStorage.saveBudgetGoals({ totalBudget: budget, categoryBudgets: DEFAULT_BUDGETS_MAP() });
        ExpenseStorage.setOnboardingCompleted(true);
        this.checkOnboarding();
        this.applyLoadedPreferences();

        this.showToast('Onboarding Completed!', `Welcome to TrackWise AI, ${name}!`, 'success');
      });
    }

    function DEFAULT_BUDETS_MAP() {
      return {
        'Software & SaaS': 100000,
        'Rent & Office': 200000,
        'Transport': 50000,
        'Food & Dining': 80000,
        'Utilities': 40000,
        'Consulting & Legal': 120000,
        'Other': 50000
      };
    }

    // 2. Sidebar Navigation Actions
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewName = item.getAttribute('data-view');
        this.switchActiveView(viewName);

        // Active marking
        navItems.forEach(i => i.classList.remove('nav-active'));
        item.classList.add('nav-active');

        // Collapse on Mobile
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth < 1024) {
          sidebar.classList.add('collapsed');
        }
      });
    });

    // 3. Burger / Sidebar Mobile toggle
    const toggleSidebarBtn = document.getElementById('sidebar-hamburger-btn');
    const closeSidebarBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');
    if (toggleSidebarBtn && sidebar) {
      toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
    if (closeSidebarBtn && sidebar) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
      });
    }

    // 4. Modal Triggers
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const modalCloseBtn = document.getElementById('close-modal-btn');
    const modalWrapper = document.getElementById('expense-modal');
    const submitExpenseBtn = document.getElementById('submit-expense-btn');

    if (addExpenseBtn && modalWrapper) {
      addExpenseBtn.addEventListener('click', () => {
        this.openExpenseForm(); // registers form
      });
    }

    if (modalCloseBtn && modalWrapper) {
      modalCloseBtn.addEventListener('click', () => {
        modalWrapper.classList.add('hidden');
        modalWrapper.classList.remove('flex');
        this.activeExpenseIdForEdit = null;
      });
    }

    if (submitExpenseBtn) {
      submitExpenseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveFormTransaction();
      });
    }

    // 5. General Profile & Notifications Trigger Dropdowns
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
        // Hide notifications
        const noteDropdown = document.getElementById('notifications-dropdown');
        if (noteDropdown) noteDropdown.classList.remove('active');
      });
    }

    const noteTrigger = document.getElementById('notifications-trigger');
    const noteDropdown = document.getElementById('notifications-dropdown');
    if (noteTrigger && noteDropdown) {
      noteTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        noteDropdown.classList.toggle('active');
        if (profileDropdown) profileDropdown.classList.remove('active');
        
        // Clear counts
        ExpenseStorage.markAllNotificationsRead();
        this.updateNotificationBadge();
      });
    }

    // Click anywhere to clear menus
    document.addEventListener('click', () => {
      if (profileDropdown) profileDropdown.classList.remove('active');
      if (noteDropdown) noteDropdown.classList.remove('active');
    });

    // 6. Inline Table Controls Listeners: Search, category filtering, Sorting, and Pagination
    const searchInput = document.getElementById('table-search-input');
    const categoryFilter = document.getElementById('table-cat-filter');
    const dateFilter = document.getElementById('table-date-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterState.search = e.target.value.trim();
        this.filterState.currentPage = 1;
        this.renderExpensesTable();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.filterState.category = e.target.value;
        this.filterState.currentPage = 1;
        this.renderExpensesTable();
      });
    }

    if (dateFilter) {
      dateFilter.addEventListener('change', (e) => {
        this.filterState.dateRange = e.target.value;
        this.filterState.currentPage = 1;
        this.renderExpensesTable();
      });
    }

    // Th Table Sorting binds
    document.querySelectorAll('.table-sort-header').forEach(header => {
      header.addEventListener('click', () => {
        const field = header.getAttribute('data-sort-field');
        if (this.filterState.sortField === field) {
          this.filterState.sortAsc = !this.filterState.sortAsc;
        } else {
          this.filterState.sortField = field;
          this.filterState.sortAsc = false;
        }

        // Rotate arrow svg indicator indicators
        document.querySelectorAll('.table-sort-header svg').forEach(svg => svg.classList.remove('rotate-180'));
        if (!this.filterState.sortAsc) {
          header.querySelector('svg')?.classList.add('rotate-180');
        }

        this.renderExpensesTable();
      });
    });

    // 7. General Options inside Settings Screen
    const saveProfileBtn = document.getElementById('save-prefs-btn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const nameVal = document.getElementById('pref-user-name')?.value.trim();
        const incomeVal = Number(document.getElementById('pref-monthly-income')?.value || 0);
        const currencyVal = document.getElementById('pref-currency')?.value || '₦';
        const budgetVal = Number(document.getElementById('pref-total-budget')?.value || 0);
        const passwordVal = document.getElementById('pref-user-password')?.value || '';

        if (!nameVal) {
          this.showToast('Validation Error', 'Username value cannot be left blank.', 'danger');
          return;
        }

        if (passwordVal && passwordVal.length < 4) {
          this.showToast('Validation Error', 'Password must be at least 4 characters long.', 'danger');
          return;
        }

        ExpenseStorage.saveUserProfile({ name: nameVal, income: incomeVal, currency: currencyVal, password: passwordVal });
        ExpenseStorage.saveBudgetGoals({ totalBudget: budgetVal, categoryBudgets: ExpenseStorage.getBudgetGoals().categoryBudgets });

        this.applyLoadedPreferences();
        this.showToast('Success', 'Preferences updated throughout workspace.', 'success');
        this.simulateSkeletonLoad();
      });
    }

    const resetDataBtn = document.getElementById('pref-danger-reset');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        if (confirm('Are you absolutely sure you want to hard reset all workspace statements? Your LocalStorage records will be deleted completely!')) {
          ExpenseStorage.resetAllData();
          window.location.reload();
        }
      });
    }

    // Theme toggle button action in top header
    const toggleThemeBtn = document.getElementById('theme-toggle-btn');
    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // CSV Export buttons triggers
    const exportBtnLeft = document.getElementById('export-data-left-btn');
    const exportBtnMain = document.getElementById('export-csv-main-btn');

    const handleExport = () => {
      this.exportExpensesToCSV();
    };

    if (exportBtnLeft) exportBtnLeft.addEventListener('click', handleExport);
    if (exportBtnMain) exportBtnMain.addEventListener('click', handleExport);

    // AI Chat trigger widget toggle actions
    this.setupWidgetControls();
  }

  setupWidgetControls() {
    const trigger = document.getElementById('chat-trigger');
    const widget = document.getElementById('chat-widget');
    const closeBtn = document.getElementById('chat-close-btn');

    if (trigger && widget) {
      trigger.addEventListener('click', () => {
        widget.classList.toggle('collapsed-chat');
        if (!widget.classList.contains('collapsed-chat')) {
          document.getElementById('chat-input')?.focus();
        }
      });
    }

    if (closeBtn && widget) {
      closeBtn.addEventListener('click', () => {
        widget.classList.add('collapsed-chat');
      });
    }

    // Sidebar AI items navigate direct into chat mode
    const navAiAssistant = document.querySelector('[data-view="ai-assistant"]');
    if (navAiAssistant) {
      navAiAssistant.addEventListener('click', () => {
        if (widget) {
          widget.classList.remove('collapsed-chat');
          document.getElementById('chat-input')?.focus();
        }
      });
    }
  }

  attachShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ALT + N: Quickly opens add expense modal
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.openExpenseForm();
      }

      // ESC: Close open modals Or widgets
      if (e.key === 'Escape') {
        const modal = document.getElementById('expense-modal');
        if (modal && !modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
          this.activeExpenseIdForEdit = null;
        }
      }
    });
  }

  switchActiveView(viewName) {
    const dashboardGrid = document.getElementById('dashboard-main-grid');
    const settingsGrid = document.getElementById('settings-main-grid');
    const heroSection = document.getElementById('welcome-hero-banner');

    if (viewName === 'dashboard') {
      if (dashboardGrid) dashboardGrid.classList.remove('hidden');
      if (settingsGrid) settingsGrid.classList.add('hidden');
      if (heroSection) heroSection.classList.remove('hidden');
    } else if (viewName === 'settings') {
      if (dashboardGrid) dashboardGrid.classList.add('hidden');
      if (settingsGrid) settingsGrid.classList.remove('hidden');
      if (heroSection) heroSection.classList.add('hidden');
    }
  }

  // Toaster Notifications Builder logic
  showToast(title, body, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast glass w-80 p-4 rounded-xl shadow-2xl flex items-start gap-3 border-l-4 border-l-primary`;

    // Type styling override
    if (type === 'success') {
      toast.style.borderLeftColor = '#00E5A8';
    } else if (type === 'danger') {
      toast.style.borderLeftColor = '#FF5A5A';
    } else if (type === 'info') {
      toast.style.borderLeftColor = '#7C5CFF';
    }

    const typeIcons = {
      success: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
      danger: `<svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
      info: `<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
    };

    toast.innerHTML = `
      <div class="p-1 shrink-0 bg-white/5 rounded-lg">${typeIcons[type]}</div>
      <div class="flex-1">
        <h4 class="text-xs font-bold text-white">${title}</h4>
        <p class="text-[11px] text-gray-400 mt-0.5">${body}</p>
      </div>
      <button class="text-white/30 hover:text-white pointer-events-auto" onclick="this.parentElement.remove()">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    `;

    container.appendChild(toast);

    // Timeout to expire card alert
    setTimeout(() => {
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  refreshDashboardData() {
    this.refreshStatistics();
    this.renderExpensesTable();
    this.updateNotificationBadge();
    this.renderNotificationsList();
    this.generateDynamicAIInsights();
  }

  refreshStatistics() {
    const expenses = ExpenseStorage.getExpenses();
    const goals = ExpenseStorage.getBudgetGoals();
    const profile = ExpenseStorage.getUserProfile();

    // 1. Calculate combinations
    const income = profile.income || 650000;
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = income - totalSpent;
    const remaining = goals.totalBudget - totalSpent;
    const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

    // 2. Map Numbers smoothly
    this.animateNumber('stat-total-balance', balance);
    this.animateNumber('stat-monthly-spending', totalSpent);
    this.animateNumber('stat-budget-remaining', remaining < 0 ? 0 : remaining);
    this.animateNumber('stat-savings-rate', savingsRate, true);

    // Sync budget stats with goals display on Settings Screen
    const goalTitle = document.getElementById('stat-budget-limit-headline');
    if (goalTitle) goalTitle.textContent = `${this.currencyPrefix}${goals.totalBudget.toLocaleString()}`;

    // 3. Render Circular Progress Ring Gauge
    this.renderGoalRingGauge(totalSpent, goals.totalBudget);
  }

  // Counting transitions for SaaS UI feeling
  animateNumber(id, endValue, isPercent = false) {
    const el = document.getElementById(id);
    if (!el) return;

    const startValue = parseFloat(el.getAttribute('data-val') || '0');
    el.setAttribute('data-val', String(endValue));

    const duration = 800; // ms
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = progress * (endValue - startValue) + startValue;

      if (isPercent) {
        el.textContent = `${current.toFixed(1)}%`;
      } else {
        el.textContent = `${this.currencyPrefix}${Math.floor(current).toLocaleString()}`;
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        if (isPercent) {
          el.textContent = `${endValue.toFixed(1)}%`;
        } else {
          el.textContent = `${this.currencyPrefix}${Math.floor(endValue).toLocaleString()}`;
        }
      }
    };

    window.requestAnimationFrame(step);
  }

  renderGoalRingGauge(spent, limit) {
    const container = document.getElementById('budget-progress-gauge');
    if (!container) return;

    const pct = Math.min((spent / limit) * 100, 100);
    const textPercentage = Math.round((spent / limit) * 100);

    // Calculate stroke SVG coordinates
    const radius = 54;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;

    // If budget burner exceeds 80%, highlight alert panel classes
    const isCritical = textPercentage >= 80;
    const gaugeColor = isCritical ? '#FF5A5A' : '#7C5CFF';
    const gaugeStrokeClasses = isCritical ? 'stroke-danger pulse-ring-critical' : 'stroke-primary';

    container.innerHTML = `
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
        <!-- Background track -->
        <circle cx="64" cy="64" r="${radius}" stroke="rgba(255,255,255,0.05)" stroke-width="10" fill="transparent"></circle>
        <!-- Progress track -->
        <circle cx="64" cy="64" r="${radius}" 
                stroke="${gaugeColor}" 
                stroke-width="10" 
                fill="transparent" 
                stroke-dasharray="${circ}" 
                stroke-dashoffset="${offset}" 
                stroke-linecap="round"
                class="${gaugeStrokeClasses} transition-all duration-700"></circle>
      </svg>
      <!-- Center content overlay -->
      <div class="absolute inset-0 flex flex-col items-center justify-center select-none text-center">
        <span class="text-2xl font-bold font-display leading-none ${isCritical ? 'text-danger' : 'text-white'}">${textPercentage}%</span>
        <span class="text-[9px] text-gray-400 mt-1 uppercase font-semibold letter-spacing-1.5 md:block hidden">Of Limit</span>
      </div>
    `;

    // Alert Panel cards toggle
    const alertBox = document.getElementById('budget-goal-critical-alert');
    if (alertBox) {
      if (isCritical) {
        alertBox.classList.remove('hidden');
        alertBox.classList.add('flex', 'budget-critical-glow');
        alertBox.querySelector('.critical-percentage-inject').textContent = `${textPercentage}%`;
      } else {
        alertBox.classList.add('hidden');
        alertBox.classList.remove('flex', 'budget-critical-glow');
      }
    }
  }

  // Sorting + Filtering + Paginating table logic
  renderExpensesTable() {
    const container = document.getElementById('expenses-table-tbody');
    if (!container) return;

    let expenses = ExpenseStorage.getExpenses();

    // 1. Text Search query
    if (this.filterState.search) {
      const q = this.filterState.search.toLowerCase();
      expenses = expenses.filter(exp => 
        exp.name.toLowerCase().includes(q) || 
        exp.category.toLowerCase().includes(q) || 
        exp.paymentMethod.toLowerCase().includes(q) ||
        (exp.description && exp.description.toLowerCase().includes(q))
      );
    }

    // 2. Category Dropdown matches
    if (this.filterState.category !== 'All') {
      expenses = expenses.filter(exp => exp.category === this.filterState.category);
    }

    // 3. Date Matchers
    if (this.filterState.dateRange !== 'All') {
      const today = new Date();
      expenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        if (isNaN(d)) return true;
        const diffDays = Math.ceil((today - d) / (1000 * 60 * 60 * 24));

        if (this.filterState.dateRange === 'Today') {
          return diffDays <= 1;
        } else if (this.filterState.dateRange === 'Last7') {
          return diffDays <= 7;
        } else if (this.filterState.dateRange === 'Last30') {
          return diffDays <= 30;
        }
        return true;
      });
    }

    // 4. Sorting logic
    expenses.sort((a, b) => {
      let v1 = a[this.filterState.sortField];
      let v2 = b[this.filterState.sortField];

      if (this.filterState.sortField === 'amount') {
        const n1 = Number(v1) || 0;
        const n2 = Number(v2) || 0;
        return this.filterState.sortAsc ? n1 - n2 : n2 - n1;
      }

      v1 = String(v1).toLowerCase();
      v2 = String(v2).toLowerCase();

      if (v1 < v2) return this.filterState.sortAsc ? -1 : 1;
      if (v1 > v2) return this.filterState.sortAsc ? 1 : -1;
      return 0;
    });

    // 5. Pagination Splitters
    const totalItems = expenses.length;
    const totalPages = Math.ceil(totalItems / this.filterState.itemsPerPage) || 1;
    
    if (this.filterState.currentPage > totalPages) {
      this.filterState.currentPage = totalPages;
    }

    const startIndex = (this.filterState.currentPage - 1) * this.filterState.itemsPerPage;
    const paginated = expenses.slice(startIndex, startIndex + this.filterState.itemsPerPage);

    // Update horizontal pagination display counters
    const counterDisplay = document.getElementById('table-pagination-counter');
    if (counterDisplay) {
      const endMarker = Math.min(startIndex + this.filterState.itemsPerPage, totalItems);
      counterDisplay.textContent = totalItems > 0 ? `Showing ${startIndex + 1} - ${endMarker} of ${totalItems} entries` : '0 - 0 of 0 entries';
    }

    // Update page buttons
    const prevBtn = document.getElementById('table-pagination-prev');
    const nextBtn = document.getElementById('table-pagination-next');

    if (prevBtn) {
      prevBtn.disabled = this.filterState.currentPage === 1;
      // Re-bind listeners neatly
      prevBtn.onclick = () => {
        if (this.filterState.currentPage > 1) {
          this.filterState.currentPage--;
          this.renderExpensesTable();
        }
      };
    }

    if (nextBtn) {
      nextBtn.disabled = this.filterState.currentPage === totalPages;
      nextBtn.onclick = () => {
        if (this.filterState.currentPage < totalPages) {
          this.filterState.currentPage++;
          this.renderExpensesTable();
        }
      };
    }

    // Clear Table content
    container.innerHTML = '';

    if (paginated.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-gray-500 text-sm">
            <div class="flex flex-col items-center justify-center">
              <svg class="w-10 h-10 mb-2 text-gray-600 opacity-60" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              No matching expense items found
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Render rows with smooth staggered entry keyframes
    paginated.forEach((exp, rIdx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150 text-sm animate-fade-in-up';
      tr.style.animationDelay = `${rIdx * 50}ms`;

      // Assign Status Pill Colours
      let statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      if (exp.status === 'Pending') {
        statusColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      } else if (exp.status === 'Cancelled') {
        statusColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      }

      tr.innerHTML = `
        <td class="py-4.5 px-4 font-medium text-white">${exp.name}</td>
        <td class="py-4.5 px-4"><span class="glass px-2.5 py-1 rounded-full text-[11px] font-semibold text-primary">${exp.category}</span></td>
        <td class="py-4.5 px-4 font-bold text-accent">${this.currencyPrefix}${exp.amount.toLocaleString()}</td>
        <td class="py-4.5 px-4 text-gray-400">${exp.date}</td>
        <td class="py-4.5 px-4 text-gray-400 text-xs">${exp.paymentMethod}</td>
        <td class="py-4.5 px-4"><span class="border px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusColor}">${exp.status}</span></td>
        <td class="py-4.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <!-- Edit -->
            <button class="action-edit-btn p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all" data-id="${exp.id}" title="Edit transaction">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </button>
            <!-- Duplicate -->
            <button class="action-duplicate-btn p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-accent transition-all" data-id="${exp.id}" title="Duplicate / Clone">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25M15.75 18.75A2.25 2.25 0 0113.5 21h-6a2.25 2.25 0 01-2.25-2.25V15M3.75 18v-3m16.5-6.108c-.373-.03-.748-.057-1.123-.08M3.75 12V9m0 6v-3m0 0a2.25 2.25 0 012.25-2.25h1.5M18 3.75h.008v.008H18V3.75z" /></svg>
            </button>
            <!-- Delete -->
            <button class="action-delete-btn p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-danger hover:scale-105 transition-all" data-id="${exp.id}" title="Delete record">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </td>
      `;

      container.appendChild(tr);
    });

    // Attach Row Event actions immediately
    this.attachTableActionListeners();
  }

  attachTableActionListeners() {
    // 1. Delete Statements
    document.querySelectorAll('.action-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this transaction record?')) {
          ExpenseStorage.deleteExpense(id);
          this.showToast('Item Deleted', 'The transaction record was purged.', 'info');
        }
      });
    });

    // 2. Clone/Duplicity
    document.querySelectorAll('.action-duplicate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const newItem = ExpenseStorage.duplicateExpense(id);
        if (newItem) {
          this.showToast('Item Duplicated', `"${newItem.name}" clone added.`, 'success');
        }
      });
    });

    // 3. Edit Form launcher
    document.querySelectorAll('.action-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openExpenseForm(id);
      });
    });
  }

  openExpenseForm(editId = null) {
    const modalWrapper = document.getElementById('expense-modal');
    if (!modalWrapper) return;

    const modalTitle = document.getElementById('modal-action-title');
    const submitBtnSpan = document.getElementById('modal-action-btn-text');

    // form elements
    const nameInput = document.getElementById('modal-exp-name');
    const amountInput = document.getElementById('modal-exp-amount');
    const catSelect = document.getElementById('modal-exp-cat');
    const dateInput = document.getElementById('modal-exp-date');
    const descInput = document.getElementById('modal-exp-desc');
    const methodInput = document.getElementById('modal-exp-method');

    if (editId) {
      // PREFILL EDIT
      this.activeExpenseIdForEdit = editId;
      const expenses = ExpenseStorage.getExpenses();
      const exp = expenses.find(item => item.id === editId);

      if (exp) {
        if (modalTitle) modalTitle.textContent = 'Edit Transaction Statement';
        if (submitBtnSpan) submitBtnSpan.textContent = 'Save Statement Changes';

        if (nameInput) nameInput.value = exp.name;
        if (amountInput) amountInput.value = exp.amount;
        if (catSelect) catSelect.value = exp.category;
        if (dateInput) dateInput.value = exp.date;
        if (descInput) descInput.value = exp.description || '';
        if (methodInput) methodInput.value = exp.paymentMethod;
      }
    } else {
      // ADD MODE RESET
      this.activeExpenseIdForEdit = null;
      if (modalTitle) modalTitle.textContent = 'Log New Expense Entry';
      if (submitBtnSpan) submitBtnSpan.textContent = 'Record Statement';

      if (nameInput) nameInput.value = '';
      if (amountInput) amountInput.value = '';
      if (catSelect) catSelect.value = 'Software & SaaS';
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (descInput) descInput.value = '';
      if (methodInput) methodInput.value = 'Corporate Visa Card';
    }

    modalWrapper.classList.remove('hidden');
    modalWrapper.classList.add('flex');
    nameInput?.focus();
  }

  saveFormTransaction() {
    const nameVal = document.getElementById('modal-exp-name')?.value.trim();
    const amountVal = Number(document.getElementById('modal-exp-amount')?.value || 0);
    const catVal = document.getElementById('modal-exp-cat')?.value || 'Other';
    const dateVal = document.getElementById('modal-exp-date')?.value;
    const descVal = document.getElementById('modal-exp-desc')?.value.trim() || '';
    const methodVal = document.getElementById('modal-exp-method')?.value || 'Cash';

    // Basic shaker form Validation animations
    if (!nameVal || amountVal <= 0 || !dateVal) {
      const modalBox = document.querySelector('#expense-modal .glass-modal');
      this.showToast('Validation Error', 'Please complete all required fields correctly.', 'danger');
      if (modalBox) {
        modalBox.classList.add('shake-element');
        setTimeout(() => modalBox.classList.remove('shake-element'), 500);
      }
      return;
    }

    const payload = {
      name: nameVal,
      amount: amountVal,
      category: catVal,
      date: dateVal,
      description: descVal,
      paymentMethod: methodVal
    };

    if (this.activeExpenseIdForEdit) {
      ExpenseStorage.updateExpense(this.activeExpenseIdForEdit, payload);
      this.showToast('Record Updated', `Successfully updated transaction: "${nameVal}".`, 'success');
    } else {
      ExpenseStorage.addExpense(payload);
      this.showToast('Record Created', `Expended ${this.currencyPrefix}${amountVal.toLocaleString()} on ${nameVal}.`, 'success');
    }

    // Dismiss modal safely
    const modalWrapper = document.getElementById('expense-modal');
    if (modalWrapper) {
      modalWrapper.classList.add('hidden');
      modalWrapper.classList.remove('flex');
    }
    this.activeExpenseIdForEdit = null;
  }

  updateNotificationBadge() {
    const notes = ExpenseStorage.getNotifications();
    const unreadCount = notes.filter(n => n.unread).length;
    const badge = document.getElementById('notifications-count-badge');

    if (badge) {
      if (unreadCount > 0) {
        badge.classList.remove('hidden');
        badge.textContent = String(unreadCount);
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  renderNotificationsList() {
    const container = document.getElementById('notifications-dropdown-list');
    if (!container) return;

    const notes = ExpenseStorage.getNotifications();
    container.innerHTML = '';

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-xs text-gray-500">No recent alerts recorded.</div>
      `;
      return;
    }

    notes.forEach(note => {
      const el = document.createElement('div');
      el.className = `p-3.5 border-b border-white/[0.04] text-xs transition-colors hover:bg-white/[0.02] ${note.unread ? 'bg-primary/5' : ''}`;
      el.innerHTML = `
        <div class="flex items-center justify-between font-bold text-white mb-0.5">
          <span>${note.title}</span>
          <span class="text-[9px] font-normal text-gray-500">${note.time}</span>
        </div>
        <div class="text-gray-400 leading-snug">${note.content}</div>
      `;
      container.appendChild(el);
    });
  }

  // Generates intelligent AI financial tips dynamically using actual database spending
  generateDynamicAIInsights() {
    const container = document.getElementById('ai-insights-block-list');
    if (!container) return;

    const expenses = ExpenseStorage.getExpenses();
    const goals = ExpenseStorage.getBudgetGoals();
    const curr = this.currencyPrefix;

    container.innerHTML = '';

    if (expenses.length === 0) {
      container.innerHTML = `
        <div class="text-xs text-gray-400 text-center py-6">Integrate transaction logs to feed analytical insights loops.</div>
      `;
      return;
    }

    // 1. Gather grouping statistics
    const catSpent = {};
    let totalSpent = 0;
    expenses.forEach(e => {
      catSpent[e.category] = (catSpent[e.category] || 0) + e.amount;
      totalSpent += e.amount;
    });

    const insights = [];

    // Category 25% or heavy consumption detection
    Object.keys(catSpent).forEach(cat => {
      const share = (catSpent[cat] / totalSpent) * 100;
      if (share >= 25) {
        insights.push({
          title: `Heavy ${cat} Consumption`,
          body: `You spent **${curr}${catSpent[cat].toLocaleString()}** on ${cat}, forming **${share.toFixed(0)}%** of overall burn.`,
          iconType: 'warning'
        });
      }
    });

    // Food expenditure custom Naira notification match (₦15,000 reference target)
    const foodSpent = catSpent['Food & Dining'] || 0;
    if (foodSpent > 15000) {
      insights.push({
        title: 'Increased Office Hospitality Spent',
        body: `Food spending sits elevated at **${curr}${foodSpent.toLocaleString()}** relative to baseline. Consider cooking or group lunches.`,
        iconType: 'info'
      });
    }

    // Budget savings opportunity check
    const remaining = goals.totalBudget - totalSpent;
    if (remaining > 50000) {
      insights.push({
        title: 'Under Budget Opportunity',
        body: `Potential savings opportunity of **${curr}${remaining.toLocaleString()}** detected. Divert these reserves into index funds or staking pools.`,
        iconType: 'savings'
      });
    } else if (remaining < 0) {
      insights.push({
        title: 'Budget Limit Exceeded',
        body: `You have overrun your cumulative budget limits by **${curr}${Math.abs(remaining).toLocaleString()}** ! Lock cards to prevent overdraws.`,
        iconType: 'alert'
      });
    }

    // Render cards using premium icon sets
    insights.slice(0, 3).forEach((ins, idx) => {
      const el = document.createElement('div');
      el.className = 'glass p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] flex gap-3 text-xs animate-fade-in-up';
      el.style.animationDelay = `${idx * 100}ms`;

      let icon = '';
      if (ins.iconType === 'alert' || ins.iconType === 'warning') {
        icon = `<svg class="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
      } else if (ins.iconType === 'savings') {
        icon = `<svg class="w-5 h-5 text-accent shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
      } else {
        icon = `<svg class="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`;
      }

      el.innerHTML = `
        <div class="p-1 shrink-0 bg-white/5 rounded-lg">${icon}</div>
        <div>
          <h5 class="font-bold text-white mb-0.5">${ins.title}</h5>
          <p class="text-gray-400 leading-snug">${ins.body.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-semibold">$1</b>')}</p>
        </div>
      `;

      container.appendChild(el);
    });
  }

  // Exports LocalStorage transaction array into raw CSV stream file
  exportExpensesToCSV() {
    const expenses = ExpenseStorage.getExpenses();
    if (expenses.length === 0) {
      this.showToast('Export Cancelled', 'No transaction statement records to write inside CSV.', 'danger');
      return;
    }

    // Form header strings
    const headers = ['Expense Name', 'Category', 'Amount', 'Date', 'Payment Method', 'Status', 'Description'];
    const rows = expenses.map(exp => [
      `"${exp.name.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      exp.amount,
      `"${exp.date}"`,
      `"${exp.paymentMethod}"`,
      `"${exp.status}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TrackWise_Statement_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF triggers

    link.click();
    document.body.removeChild(link);

    this.showToast('Export Success', 'Statements exported into CSV spreadsheet.', 'success');
  }
}

// Instantiate and start app controller in the global layout
const app = new AppController();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
