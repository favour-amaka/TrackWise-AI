/**
 * TrackWise AI - AI Chat Assistant Module
 * Implements a smart, context-rich intelligence engine that acts as a real-time financial advisor.
 * Analyzes LocalStorage database in real time to deliver accurate, tailored, domain-specific insights.
 */

import { ExpenseStorage } from './storage.js';

export class ChatBot {
  constructor(messagesContainer, typingIndicator, sendInput, sendBtn, quickActions) {
    this.messagesContainer = messagesContainer;
    this.typingIndicator = typingIndicator;
    this.sendInput = sendInput;
    this.sendBtn = sendBtn;
    this.quickActions = quickActions;
    this.isTyping = false;
  }

  init() {
    this.setupListeners();
    this.addWelcomeMessage();
  }

  setupListeners() {
    // Send message on click
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    // Send on Enter
    if (this.sendInput) {
      this.sendInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Add click listeners to quick action chips
    if (this.quickActions) {
      this.quickActions.forEach(btn => {
        btn.addEventListener('click', () => {
          const promptText = btn.getAttribute('data-prompt') || btn.textContent.trim();
          this.sendUserMessage(promptText);
          this.respondToPrompt(promptText);
        });
      });
    }
  }

  addWelcomeMessage() {
    const profile = ExpenseStorage.getUserProfile();
    const name = profile.name ? profile.name.split(' ')[0] : 'there';
    
    // Clear container
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }

    this.addBubbleAI(
      `Hello ${name}! 👋 I am **TrackWise AI Advisor**.<br><br>` +
      `I have analyzed your transactions and category margins. Ask me something like:<br>` +
      `• *How much did I spend on food?*<br>` +
      `• *Which category costs me the most?*<br>` +
      `• *Am I within my budget?*`
    );
  }

  handleSendMessage() {
    if (!this.sendInput) return;
    const text = this.sendInput.value.trim();
    if (!text || this.isTyping) return;

    this.sendUserMessage(text);
    this.sendInput.value = '';
    this.respondToPrompt(text);
  }

  sendUserMessage(text) {
    this.addBubbleUser(text);
  }

  respondToPrompt(prompt) {
    this.showTyping(true);

    // Simulate natural intelligence thinking/latency
    setTimeout(() => {
      this.showTyping(false);
      const answer = this.calculateResponse(prompt);
      this.addBubbleAI(answer);
    }, 1200 + Math.random() * 800);
  }

  showTyping(show) {
    this.isTyping = show;
    if (!this.typingIndicator) return;
    
    if (show) {
      this.typingIndicator.classList.remove('hidden');
      this.typingIndicator.classList.add('flex');
    } else {
      this.typingIndicator.classList.add('hidden');
      this.typingIndicator.classList.remove('flex');
    }
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  addBubbleUser(content) {
    const bubble = document.createElement('div');
    bubble.className = 'flex justify-end mb-4 animate-fade-in-up';
    bubble.innerHTML = `
      <div class="chat-bubble-user max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-md">
        ${content}
      </div>
    `;
    if (this.messagesContainer) {
      this.messagesContainer.appendChild(bubble);
    }
    this.scrollToBottom();
  }

  addBubbleAI(content) {
    const bubble = document.createElement('div');
    bubble.className = 'flex justify-start mb-4 gap-2 animate-fade-in-up';
    bubble.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center border border-primary/20 shrink-0 select-none">
        <svg class="w-4 h-4 text-primary animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75c0 .414-.168.75-.5.75s-.5-.336-.5-.75.168-.75.5-.75.5.336.5.75zM14.25 9.75c0 .414-.168.75-.5.75s-.5-.336-.5-.75.168-.75.5-.75.5.336.5.75z" />
        </svg>
      </div>
      <div class="chat-bubble-ai max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md text-gray-200">
        ${content}
      </div>
    `;
    if (this.messagesContainer) {
      this.messagesContainer.appendChild(bubble);
    }
    this.scrollToBottom();
  }

  /* Core Intelligence processing based on real expense array */
  calculateResponse(msg) {
    const expenses = ExpenseStorage.getExpenses();
    const goals = ExpenseStorage.getBudgetGoals();
    const profile = ExpenseStorage.getUserProfile();
    const curr = profile.currency || '₦';

    const lower = msg.toLowerCase();

    // Grouping calculations
    let totalSpent = 0;
    const catMap = {};
    expenses.forEach(e => {
      totalSpent += e.amount;
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    // 1. Food Check
    if (lower.includes('food') || lower.includes('eat') || lower.includes('dining')) {
      const spent = catMap['Food & Dining'] || 0;
      const budget = goals.categoryBudgets['Food & Dining'] || 1;
      const pct = ((spent / budget) * 100).toFixed(0);
      return `You spent **${curr}${spent.toLocaleString()}** on Food & Dining this month.<br><br>` +
             `This represents **${pct}%** of your category budget of ${curr}${budget.toLocaleString()}. ` +
             (pct > 80 ? '⚠️ *You are nearing your limits, please spend mindfully.*' : '✅ *You are spending comfortably within margins.*');
    }

    // 2. Transport Check
    if (lower.includes('transport') || lower.includes('uber') || lower.includes('cab') || lower.includes('car')) {
      const spent = catMap['Transport'] || 0;
      const budget = goals.categoryBudgets['Transport'] || 1;
      const pct = ((spent / budget) * 100).toFixed(0);
      return `You spent **${curr}${spent.toLocaleString()}** on Transport services.<br><br>` +
             `This forms **${pct}%** of your target cap of ${curr}${budget.toLocaleString()} for transit logistics.`;
    }

    // 3. Category with highest cost
    if (lower.includes('category costs') || lower.includes('highest spending') || lower.includes('most cost') || lower.includes('highest cost') || lower.includes('spend most')) {
      if (expenses.length === 0) return `You possess no recorded transactions to evaluate yet. Let's record some first!`;

      // Find top spending category
      let highestCat = '';
      let highestAmt = 0;
      Object.keys(catMap).forEach(cat => {
        if (catMap[cat] > highestAmt) {
          highestAmt = catMap[cat];
          highestCat = cat;
        }
      });
      const pct = ((highestAmt / totalSpent) * 100).toFixed(0);
      return `Your highest cost category is **${highestCat}**, totaling **${curr}${highestAmt.toLocaleString()}**.<br><br>` +
             `This single category accounts for **${pct}%** of your total records this month. Let's optimize workspace expenditures here if possible.`;
    }

    // 4. Budget report summary
    if (lower.includes('budget') || lower.includes('report') || lower.includes('summary') || lower.includes('spent') || lower.includes('status')) {
      const totalBudget = goals.totalBudget;
      const pct = ((totalSpent / totalBudget) * 100).toFixed(1);
      const remaining = totalBudget - totalSpent;

      let verdict = '';
      if (pct > 90) {
        verdict = '🚨 **Critical Alert**: You have exhausted almost all budget thresholds! Freeze non-essential purchases immediately.';
      } else if (pct > 80) {
        verdict = '⚠️ **Warning**: You are over 80% threshold of your budget limit. Restrict overhead billing.';
      } else {
        verdict = '🛡️ **Stable Status**: Healthy metrics detected so far. Keep logging statements regularly.';
      }

      return `### Monthly Budget Status Report:<br><br>` +
             `• **Combined Budget**: ${curr}${totalBudget.toLocaleString()}<br>` +
             `• **Combined Spent**: ${curr}${totalSpent.toLocaleString()}<br>` +
             `• **Available Funds**: ${curr}${remaining.toLocaleString()}<br>` +
             `• **Budget Burn Rate**: **${pct}%**<br><br>` +
             `${verdict}`;
    }

    // 5. Help / Add Expense triggers
    if (lower.includes('add expense') || lower.includes('register') || lower.includes('add transaction')) {
      // Trigger modal click
      setTimeout(() => {
        const addBtn = document.getElementById('add-expense-btn');
        if (addBtn) addBtn.click();
      }, 300);
      return `Certainly! Launching the glassmorphic transactional form for you now. Just fill out the fields.`;
    }

    // Fallback creative advisor dialog
    return `I've analyzed your current account logs. You spent a total of **${curr}${totalSpent.toLocaleString()}** against a cumulative budget limit of **${curr}${goals.totalBudget.toLocaleString()}** (${((totalSpent / goals.totalBudget) * 100).toFixed(0)}% burner rate).<br><br>` +
           `Feel free to query about specific groupings (e.g. "Software and SaaS"), your highest spending records, or tell me to "Add expense"!`;
  }
}
