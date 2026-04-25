// src/schemas.ts
// Zod runtime validation schemas.
// Imports from 'zod' only — no circular dependency back to types.ts.

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

export const ExpenseTypeSchema = z.enum(['subscription', 'food', 'misc', 'utility', 'transport']);
export const IncomeTypeSchema  = z.enum(['salary', 'donation', 'loan', 'investment', 'other']);
export const DebtStatusSchema  = z.enum(['open', 'partial', 'paid']);

// ---------------------------------------------------------------------------
// Record schemas
// ---------------------------------------------------------------------------

export const ExpenseSchema = z.object({
  id:       z.uuid(),
  date:     z.string().regex(ISO_DATE_RE, 'Date must be YYYY-MM-DD'),
  amount:   z.number().int().positive(),
  currency: z.string().length(3),
  type:     ExpenseTypeSchema,
  note:     z.string().min(1),
  location: z.string().optional(),
});

export const IncomeSchema = z.object({
  id:       z.uuid(),
  date:     z.string().regex(ISO_DATE_RE, 'Date must be YYYY-MM-DD'),
  amount:   z.number().int().positive(),
  currency: z.string().length(3),
  type:     IncomeTypeSchema,
  note:     z.string().min(1),
  source:   z.string().min(1),
});

export const DebtSchema = z.object({
  id:           z.uuid(),
  amount:       z.number().int().positive(),
  currency:     z.string().length(3),
  dueDate:      z.string().regex(ISO_DATE_RE, 'Date must be YYYY-MM-DD'),
  person:       z.string().min(1),
  note:         z.string().min(1),
  status:       DebtStatusSchema.default('open'),
  interestRate: z.number().min(0).max(100).optional(),
});

export const LedgerMetaSchema = z.object({
  title:    z.string().default('Finance Ledger'),
  currency: z.string().length(3).default('XOF'),
  updated:  z.string().regex(ISO_DATE_RE, 'Date must be YYYY-MM-DD'),
});

// ---------------------------------------------------------------------------
// Input schemas (id omitted — DataStore assigns IDs on insert)
// ---------------------------------------------------------------------------

export const ExpenseInputSchema = ExpenseSchema.omit({ id: true });
export const IncomeInputSchema  = IncomeSchema.omit({ id: true });
export const DebtInputSchema    = DebtSchema.omit({ id: true });

// ---------------------------------------------------------------------------
// Inferred types (use these in Phase 2+ instead of interfaces from types.ts
// when you need the Zod-derived shape; both are compatible)
// ---------------------------------------------------------------------------

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;
export type IncomeInput  = z.infer<typeof IncomeInputSchema>;
export type DebtInput    = z.infer<typeof DebtInputSchema>;

export type Expense = z.infer<typeof ExpenseSchema>;
export type Income  = z.infer<typeof IncomeSchema>;
export type Debt    = z.infer<typeof DebtSchema>;
