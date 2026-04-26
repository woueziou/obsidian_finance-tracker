// src/store/DataStore.ts
// In-memory store for financial records. Synchronous CRUD + pub/sub.
// File I/O is handled by the plugin layer — DataStore has no async operations.

import type { Ledger } from '../types.ts';
import type { Expense, Income, Debt, ExpenseInput, IncomeInput, DebtInput } from '../schemas.ts';
import { ExpenseSchema, IncomeSchema, DebtSchema } from '../schemas.ts';

export interface DashboardTransaction {
  date: string;
  note: string;
  amount: number;
  type: string;
  kind: 'expense' | 'income';
}

export class DataStore {
  private expenses: Map<string, Expense> = new Map();
  private incomes:  Map<string, Income>  = new Map();
  private debts:    Map<string, Debt>    = new Map();
  private listeners: Set<() => void>     = new Set();

  // ---------------------------------------------------------------------------
  // Load (from file — IDs already assigned by MarkdownSerializer.deserialize)
  // ---------------------------------------------------------------------------

  load(ledger: Ledger): void {
    this.expenses.clear();
    this.incomes.clear();
    this.debts.clear();
    ledger.expenses.forEach(e => this.expenses.set(e.id, e));
    ledger.incomes.forEach(i  => this.incomes.set(i.id, i));
    ledger.debts.forEach(d    => this.debts.set(d.id, d));
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Expense CRUD
  // ---------------------------------------------------------------------------

  /** Modal path: receives input without id, mints a new UUID. */
  addExpense(input: ExpenseInput): Expense {
    const record: Expense = { ...input, id: crypto.randomUUID() };
    ExpenseSchema.parse(record);
    this.expenses.set(record.id, record);
    this.notify();
    return record;
  }

  getExpenses(): Expense[] {
    return [...this.expenses.values()];
  }

  getExpensesByDate(date: string): Expense[] {
    return this.getExpenses().filter(e => e.date === date);
  }

  getExpensesByType(type: Expense['type']): Expense[] {
    return this.getExpenses().filter(e => e.type === type);
  }

  updateExpense(id: string, patch: Partial<ExpenseInput>): Expense {
    const existing = this.expenses.get(id);
    if (!existing) throw new Error(`Expense not found: ${id}`);
    const updated: Expense = { ...existing, ...patch };
    ExpenseSchema.parse(updated);
    this.expenses.set(id, updated);
    this.notify();
    return updated;
  }

  deleteExpense(id: string): void {
    if (!this.expenses.has(id)) throw new Error(`Expense not found: ${id}`);
    this.expenses.delete(id);
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Income CRUD
  // ---------------------------------------------------------------------------

  addIncome(input: IncomeInput): Income {
    const record: Income = { ...input, id: crypto.randomUUID() };
    IncomeSchema.parse(record);
    this.incomes.set(record.id, record);
    this.notify();
    return record;
  }

  getIncomes(): Income[] {
    return [...this.incomes.values()];
  }

  getIncomesByDate(date: string): Income[] {
    return this.getIncomes().filter(i => i.date === date);
  }

  updateIncome(id: string, patch: Partial<IncomeInput>): Income {
    const existing = this.incomes.get(id);
    if (!existing) throw new Error(`Income not found: ${id}`);
    const updated: Income = { ...existing, ...patch };
    IncomeSchema.parse(updated);
    this.incomes.set(id, updated);
    this.notify();
    return updated;
  }

  deleteIncome(id: string): void {
    if (!this.incomes.has(id)) throw new Error(`Income not found: ${id}`);
    this.incomes.delete(id);
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Debt CRUD
  // ---------------------------------------------------------------------------

  addDebt(input: DebtInput): Debt {
    const record: Debt = { ...input, id: crypto.randomUUID() };
    DebtSchema.parse(record);
    this.debts.set(record.id, record);
    this.notify();
    return record;
  }

  getDebts(): Debt[] {
    return [...this.debts.values()];
  }

  updateDebt(id: string, patch: Partial<DebtInput>): Debt {
    const existing = this.debts.get(id);
    if (!existing) throw new Error(`Debt not found: ${id}`);
    const updated: Debt = { ...existing, ...patch };
    DebtSchema.parse(updated);
    this.debts.set(id, updated);
    this.notify();
    return updated;
  }

  deleteDebt(id: string): void {
    if (!this.debts.has(id)) throw new Error(`Debt not found: ${id}`);
    this.debts.delete(id);
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Aggregations
  // ---------------------------------------------------------------------------

  getMonthlyExpenseTotal(year: number, month: number): number {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.getExpenses()
      .filter(e => e.date.startsWith(prefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getExpenseSummaryByType(year: number, month: number): Record<Expense['type'], number> {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const summary: Record<Expense['type'], number> = {
      subscription: 0,
      food: 0,
      misc: 0,
      utility: 0,
      transport: 0,
    };
    for (const e of this.getExpenses()) {
      if (e.date.startsWith(prefix)) {
        summary[e.type] += e.amount;
      }
    }
    return summary;
  }

  getMonthlyIncomeTotal(year: number, month: number): number {
    return this.getIncomes()
      .filter(i => {
        const d = new Date(i.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((sum, i) => sum + i.amount, 0);
  }

  getOpenDebts(): Debt[] {
    return this.getDebts().filter(d => d.status === 'open' || d.status === 'partial');
  }

  getCumulativeBalance(from: string, to: string): { labels: string[]; data: number[] } {
    const days: string[] = [];
    const cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
      days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    const dailyNet: Record<string, number> = {};
    for (const d of days) dailyNet[d] = 0;
    for (const e of this.getExpenses()) {
      if (e.date >= from && e.date <= to) dailyNet[e.date] = (dailyNet[e.date] ?? 0) - e.amount;
    }
    for (const i of this.getIncomes()) {
      if (i.date >= from && i.date <= to) dailyNet[i.date] = (dailyNet[i.date] ?? 0) + i.amount;
    }
    let running = 0;
    const data = days.map(d => { running += (dailyNet[d] as number); return running / 100; });
    return { labels: days, data };
  }

  getRecentTransactions(from: string, to: string, limit: number): DashboardTransaction[] {
    const rows: DashboardTransaction[] = [];
    for (const e of this.getExpenses()) {
      if (e.date >= from && e.date <= to)
        rows.push({ date: e.date, note: e.note ?? '', amount: e.amount, type: e.type, kind: 'expense' });
    }
    for (const i of this.getIncomes()) {
      if (i.date >= from && i.date <= to)
        rows.push({ date: i.date, note: i.note ?? '', amount: i.amount, type: i.type, kind: 'income' });
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // Pub/Sub
  // ---------------------------------------------------------------------------

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {
        console.warn('[Finance Tracker] DataStore listener threw an error');
      }
    });
  }
}