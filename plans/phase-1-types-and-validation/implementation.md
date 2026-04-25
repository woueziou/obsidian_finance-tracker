# Phase 1 — Types & Validation: Implementation Plan

## Files to Create

```
src/types.ts
src/schemas.ts
```

## Step-by-Step

### Step 1 — Define union/enum types in `types.ts`

```typescript
export type ExpenseType = 'subscription' | 'food' | 'misc' | 'utility' | 'transport';
export type IncomeType  = 'salary' | 'donation' | 'loan' | 'investment' | 'other';
export type DebtStatus  = 'open' | 'partial' | 'paid';
```

These are string unions, not TypeScript `enum`. Reason: string unions serialize cleanly to JSON and markdown without an extra import.

### Step 2 — Define record interfaces in `types.ts`

```typescript
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
  date: string;
  amount: number;
  currency: string;
  type: IncomeType;
  note: string;
  source: string;
}

export interface Debt {
  id: string;
  amount: number;
  currency: string;
  dueDate: string;     // ISO 8601
  person: string;
  note: string;
  status: DebtStatus;
  interestRate?: number; // decimal %, e.g. 5.0
}
```

### Step 3 — Define container and error interfaces in `types.ts`

```typescript
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

### Step 4 — Implement Zod schemas in `schemas.ts`

```typescript
import { z } from 'zod';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const ExpenseTypeSchema = z.enum(['subscription', 'food', 'misc', 'utility', 'transport']);
export const IncomeTypeSchema  = z.enum(['salary', 'donation', 'loan', 'investment', 'other']);
export const DebtStatusSchema  = z.enum(['open', 'partial', 'paid']);

export const ExpenseSchema = z.object({
  id:       z.string().uuid(),
  date:     z.string().regex(ISO_DATE_RE, 'Date must be YYYY-MM-DD'),
  amount:   z.number().int().positive(),
  currency: z.string().length(3),
  type:     ExpenseTypeSchema,
  note:     z.string().min(1),
  location: z.string().optional(),
});

export const IncomeSchema = z.object({
  id:       z.string().uuid(),
  date:     z.string().regex(ISO_DATE_RE),
  amount:   z.number().int().positive(),
  currency: z.string().length(3),
  type:     IncomeTypeSchema,
  note:     z.string().min(1),
  source:   z.string().min(1),
});

export const DebtSchema = z.object({
  id:           z.string().uuid(),
  amount:       z.number().int().positive(),
  currency:     z.string().length(3),
  dueDate:      z.string().regex(ISO_DATE_RE),
  person:       z.string().min(1),
  note:         z.string().min(1),
  status:       DebtStatusSchema.default('open'),
  interestRate: z.number().min(0).max(100).optional(),
});

export const LedgerMetaSchema = z.object({
  title:    z.string().default('Finance Ledger'),
  currency: z.string().length(3).default('XOF'),
  updated:  z.string().regex(ISO_DATE_RE),
});
```

### Step 5 — Derive input schemas (for modals, no `id`)

```typescript
export const ExpenseInputSchema = ExpenseSchema.omit({ id: true });
export const IncomeInputSchema  = IncomeSchema.omit({ id: true });
export const DebtInputSchema    = DebtSchema.omit({ id: true });

export type Expense      = z.infer<typeof ExpenseSchema>;
export type Income       = z.infer<typeof IncomeSchema>;
export type Debt         = z.infer<typeof DebtSchema>;
export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;
export type IncomeInput  = z.infer<typeof IncomeInputSchema>;
export type DebtInput    = z.infer<typeof DebtInputSchema>;
```

### Step 6 — Settings types (add to `types.ts`)

```typescript
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
```

## Pitfalls to Avoid

- Do not use TypeScript `enum` — use string unions. `enum` compiles to a runtime object and creates friction with Zod.
- Do not import types from `schemas.ts` into `types.ts` — schemas depend on types, not the reverse. Circular imports will break the build.
- Do not add `.toUpperCase()` transform to currency in Zod — it silently mutates input data. Validate length only; normalization is the caller's job.
- Do not use `z.coerce.number()` for amounts — if something non-numeric enters, fail loudly, not silently.
