// src/types.ts
// Plain TypeScript interfaces and string unions.
// No project imports — this file is the root of the dependency graph.

// ---------------------------------------------------------------------------
// Union types
// ---------------------------------------------------------------------------

export type ExpenseType = 'subscription' | 'food' | 'misc' | 'utility' | 'transport';
export type IncomeType  = 'salary' | 'donation' | 'loan' | 'investment' | 'other';
export type DebtStatus  = 'open' | 'partial' | 'paid';

// ---------------------------------------------------------------------------
// Record interfaces
// ---------------------------------------------------------------------------

export interface Expense {
  id: string;
  date: string;        // ISO 8601: YYYY-MM-DD
  amount: number;      // cents, positive integer
  currency: string;    // ISO 4217: XOF, USD, EUR
  type: ExpenseType;
  note: string;
  location?: string;
}

export interface Income {
  id: string;
  date: string;        // ISO 8601: YYYY-MM-DD
  amount: number;      // cents, positive integer
  currency: string;    // ISO 4217
  type: IncomeType;
  note: string;
  source: string;
}

export interface Debt {
  id: string;
  amount: number;      // cents, positive integer
  currency: string;    // ISO 4217
  dueDate: string;     // ISO 8601: YYYY-MM-DD
  person: string;
  note: string;
  status: DebtStatus;
  interestRate?: number; // decimal %, e.g. 5.0
}

// ---------------------------------------------------------------------------
// Container interfaces
// ---------------------------------------------------------------------------

export interface LedgerMeta {
  title: string;
  currency: string;  // ledger default currency
  updated: string;   // ISO 8601 date
}

export interface Ledger {
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
  meta: LedgerMeta;
}

// ---------------------------------------------------------------------------
// Parse result
// ---------------------------------------------------------------------------

export interface ParseError {
  line: number;
  raw: string;
  message: string;
}

export interface ParseResult {
  ledger: Ledger;
  errors: ParseError[];
}

// ---------------------------------------------------------------------------
// Plugin settings
// ---------------------------------------------------------------------------

export interface PluginSettings {
  ledgerPath:      string;
  exportDirectory: string;
  currency:        string;
  dateFormat:      string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  ledgerPath:      'finance-ledger.md',
  exportDirectory: 'Finance/exports',
  currency:        'XOF',
  dateFormat:      'YYYY-MM-DD',
};
