# Data Models

## TypeScript Interfaces (`src/types.ts`)

```typescript
export type ExpenseType = 'subscription' | 'food' | 'misc' | 'utility' | 'transport';
export type IncomeType = 'salary' | 'donation' | 'loan' | 'investment' | 'other';
export type DebtStatus = 'open' | 'partial' | 'paid';

export interface Expense {
  id: string;           // crypto.randomUUID()
  date: string;         // ISO 8601: YYYY-MM-DD
  amount: number;       // cents (integer, positive)
  currency: string;     // ISO 4217: XOF, USD, EUR
  type: ExpenseType;
  note: string;
  location?: string;    // optional free text
}

export interface Income {
  id: string;
  date: string;
  amount: number;       // cents
  currency: string;
  type: IncomeType;
  note: string;
  source: string;
}

export interface Debt {
  id: string;
  amount: number;       // cents
  currency: string;
  dueDate: string;      // ISO 8601
  person: string;
  note: string;
  status: DebtStatus;
  interestRate?: number; // decimal percentage, e.g. 5.0
}

export interface Ledger {
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
  meta: LedgerMeta;
}

export interface LedgerMeta {
  title: string;
  currency: string;    // default currency for the ledger
  updated: string;     // ISO 8601 date
}

export interface ParseError {
  line: number;
  raw: string;
  message: string;
}

export interface ParseResult {
  ledger: Ledger;
  errors: ParseError[];
}
```

---

## Zod Schemas (`src/schemas.ts`)

```typescript
import { z } from 'zod';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ExpenseTypeSchema = z.enum(['subscription', 'food', 'misc', 'utility', 'transport']);
export const IncomeTypeSchema = z.enum(['salary', 'donation', 'loan', 'investment', 'other']);
export const DebtStatusSchema = z.enum(['open', 'partial', 'paid']);

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(ISO_DATE, 'Date must be YYYY-MM-DD'),
  amount: z.number().int().positive(),
  currency: z.string().length(3).toUpperCase(),
  type: ExpenseTypeSchema,
  note: z.string().min(1),
  location: z.string().optional(),
});

export const IncomeSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(ISO_DATE),
  amount: z.number().int().positive(),
  currency: z.string().length(3).toUpperCase(),
  type: IncomeTypeSchema,
  note: z.string().min(1),
  source: z.string().min(1),
});

export const DebtSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int().positive(),
  currency: z.string().length(3).toUpperCase(),
  dueDate: z.string().regex(ISO_DATE),
  person: z.string().min(1),
  note: z.string().min(1),
  status: DebtStatusSchema.default('open'),
  interestRate: z.number().min(0).max(100).optional(),
});

export const LedgerMetaSchema = z.object({
  title: z.string().default('Finance Ledger'),
  currency: z.string().length(3).toUpperCase().default('XOF'),
  updated: z.string().regex(ISO_DATE),
});

// Input schemas for modal forms (id omitted — assigned on insert)
export const ExpenseInputSchema = ExpenseSchema.omit({ id: true });
export const IncomeInputSchema = IncomeSchema.omit({ id: true });
export const DebtInputSchema = DebtSchema.omit({ id: true });

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;
export type IncomeInput = z.infer<typeof IncomeInputSchema>;
export type DebtInput = z.infer<typeof DebtInputSchema>;
```

---

## Amount Conventions

| Raw user input | Stored value | Display |
|---|---|---|
| `15000 XOF` | `1500000` (cents) | `15,000 XOF` |
| `3000 XOF` | `300000` | `3,000 XOF` |
| `150000 XOF` | `15000000` | `150,000 XOF` |

**Parse**: `parseInt(rawAmount, 10) * 100`
**Display**: `(cents / 100).toLocaleString('fr-TG', { style: 'currency', currency: 'XOF' })`

> Note: XOF (West African CFA franc) has no decimal subunit, so `15000 XOF` stored as `1500000` cents is technically over-precise. This is intentional — it keeps the storage model consistent for multi-currency support later, and integer arithmetic is correct regardless.

---

## Plugin Settings

```typescript
export interface PluginSettings {
  ledgerPath: string;      // default: 'finance-ledger.md'
  exportDirectory: string; // default: 'Finance/exports'
  currency: string;        // default: 'XOF'
  dateFormat: string;      // default: 'YYYY-MM-DD' (display only)
}

export const DEFAULT_SETTINGS: PluginSettings = {
  ledgerPath: 'finance-ledger.md',
  exportDirectory: 'Finance/exports',
  currency: 'XOF',
  dateFormat: 'YYYY-MM-DD',
};
```
