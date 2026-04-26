// src/commands/index.ts
// Registers all command palette entries for the Finance Tracker plugin.

import type FinanceTrackerPlugin from '../main';
import { AddExpenseModal } from './addExpense';
import { AddIncomeModal } from './addIncome';
import { AddDebtModal } from './addDebt';

export function registerCommands(plugin: FinanceTrackerPlugin): void {
  plugin.addCommand({
    id: 'add-expense',
    name: 'Add Expense',
    callback: () => new AddExpenseModal(plugin.app, plugin).open(),
  });

  plugin.addCommand({
    id: 'add-income',
    name: 'Add Income',
    callback: () => new AddIncomeModal(plugin.app, plugin).open(),
  });

  plugin.addCommand({
    id: 'add-debt',
    name: 'Add Debt',
    callback: () => new AddDebtModal(plugin.app, plugin).open(),
  });
}
