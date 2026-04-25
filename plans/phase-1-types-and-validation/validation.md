# Phase 1 — Types & Validation: Validation Checklist

This file defines the measurable criteria that must ALL pass before Phase 1 is considered complete.

---

## Compiler Checks

- [ ] `tsc --noEmit --strict` exits with code 0 on `src/types.ts`
- [ ] `tsc --noEmit --strict` exits with code 0 on `src/schemas.ts`
- [ ] Zero uses of `any` in either file (`grep -n ': any' src/types.ts src/schemas.ts` returns nothing)
- [ ] Zero uses of TypeScript `enum` keyword (`grep -n 'enum ' src/types.ts src/schemas.ts` returns nothing)

---

## Schema Rejection Tests (run manually in a test file or REPL)

Run `bun run` or `npx ts-node` and confirm each of the following throws `ZodError`:

```typescript
import { ExpenseSchema, IncomeSchema, DebtSchema } from './src/schemas';

// Negative amount
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: -100, currency: 'XOF', type: 'food', note: 'test' });
// Expected: ZodError — number must be greater than 0

// Zero amount
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 0, currency: 'XOF', type: 'food', note: 'test' });
// Expected: ZodError

// Float amount
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 1500.50, currency: 'XOF', type: 'food', note: 'test' });
// Expected: ZodError — must be integer

// Invalid type
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 1500000, currency: 'XOF', type: 'luxury', note: 'test' });
// Expected: ZodError

// Wrong date format
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '25/04/2026', amount: 1500000, currency: 'XOF', type: 'food', note: 'test' });
// Expected: ZodError

// Empty note
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 1500000, currency: 'XOF', type: 'food', note: '' });
// Expected: ZodError

// Invalid UUID
ExpenseSchema.parse({ id: 'not-a-uuid', date: '2026-04-25', amount: 1500000, currency: 'XOF', type: 'food', note: 'test' });
// Expected: ZodError

// Wrong currency length
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 1500000, currency: 'XOFX', type: 'food', note: 'test' });
// Expected: ZodError
```

---

## Schema Acceptance Tests

Confirm each of the following does NOT throw:

```typescript
// Valid expense with location
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 1500000, currency: 'XOF', type: 'food', note: 'rice', location: 'market' });

// Valid expense without location
ExpenseSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 300000, currency: 'XOF', type: 'subscription', note: 'Netflix' });

// Valid income
IncomeSchema.parse({ id: crypto.randomUUID(), date: '2026-04-25', amount: 15000000, currency: 'XOF', type: 'salary', note: 'April', source: 'freelance client' });

// Valid debt with defaults
const debt = DebtSchema.parse({ id: crypto.randomUUID(), amount: 10000000, currency: 'XOF', dueDate: '2026-06-01', person: 'Kofi', note: 'laptop loan' });
console.assert(debt.status === 'open'); // default applied

// Valid debt with all optional fields
DebtSchema.parse({ id: crypto.randomUUID(), amount: 10000000, currency: 'XOF', dueDate: '2026-06-01', person: 'Bank', note: 'equipment', status: 'partial', interestRate: 5.0 });
```

---

## Type Compatibility Tests

Confirm TypeScript does not error on these assignments:

```typescript
import type { Expense, Income, Debt, ExpenseInput } from './src/types';

const e: Expense = { id: '...', date: '2026-04-25', amount: 1500000, currency: 'XOF', type: 'food', note: 'rice' };
const i: Income  = { id: '...', date: '2026-04-25', amount: 15000000, currency: 'XOF', type: 'salary', note: 'April', source: 'client' };
const d: Debt    = { id: '...', amount: 10000000, currency: 'XOF', dueDate: '2026-06-01', person: 'Kofi', note: 'loan', status: 'open' };

// ExpenseInput has no id field — the following should cause a TS error if uncommented:
// const bad: ExpenseInput = { id: '...', date: '2026-04-25', amount: 1500000, currency: 'XOF', type: 'food', note: 'test' };
```

---

## Phase Exit Criteria

Phase 1 is complete when ALL of the following are true:

- [ ] `src/types.ts` and `src/schemas.ts` exist
- [ ] `tsc --noEmit --strict` is clean (zero errors)
- [ ] All schema rejection tests above throw `ZodError`
- [ ] All schema acceptance tests above pass without throwing
- [ ] `ExpenseInput`, `IncomeInput`, `DebtInput` are exported and do not include `id`
- [ ] `DEFAULT_SETTINGS` is exported and fully typed
- [ ] No `any`, no `enum`, no circular imports
