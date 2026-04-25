# Phase 1 — Types & Validation: User Stories

## Story 1 — Expense shape is unambiguous

**As a** developer implementing a parser or modal,  
**I want** a single canonical TypeScript type for `Expense`,  
**So that** I never have to guess whether the field is `expenseType`, `type`, or `category`.

**Acceptance criteria:**
- `Expense` interface exists in `src/types.ts`
- Fields: `id`, `date`, `amount`, `currency`, `type`, `note`, `location?`
- `ExpenseType` union type is exported and used as the `type` field
- TypeScript compiler rejects any usage with an extra or misspelled field

---

## Story 2 — Income shape is unambiguous

**As a** developer implementing an income modal,  
**I want** a typed `Income` interface with a `source` field distinct from `note`,  
**So that** I can display "from: <source>" in the markdown ledger without guessing the field name.

**Acceptance criteria:**
- `Income` interface exported from `src/types.ts`
- Fields: `id`, `date`, `amount`, `currency`, `type`, `note`, `source`
- `IncomeType` union exported
- `source` is required (not optional)

---

## Story 3 — Debt shape includes status and optional interest rate

**As a** user tracking tontine contributions and informal loans,  
**I want** debt records to have a `status` field (`open`/`partial`/`paid`) and an optional interest rate,  
**So that** I can track partially repaid debts and understand the cost of interest-bearing loans.

**Acceptance criteria:**
- `Debt` interface exported from `src/types.ts`
- `status` field of type `DebtStatus` defaults to `'open'` in Zod schema
- `interestRate` is optional (`number | undefined`)
- `dueDate` is named `dueDate` (camelCase), not `due` or `due_date`

---

## Story 4 — Invalid data is rejected at runtime

**As a** developer calling `ExpenseSchema.parse(formData)` from a modal,  
**I want** Zod to throw a descriptive error if the amount is negative or the type is unrecognized,  
**So that** bad data never silently enters the DataStore.

**Acceptance criteria:**
- `ExpenseSchema.parse({ ...validExpense, amount: -500 })` throws `ZodError`
- `ExpenseSchema.parse({ ...validExpense, type: 'luxury' })` throws `ZodError`
- `ExpenseSchema.parse({ ...validExpense, date: '25/04/2026' })` throws `ZodError` (wrong format)
- `ExpenseSchema.parse({ ...validExpense, id: 'not-a-uuid' })` throws `ZodError`

---

## Story 5 — Modal form data has a separate input schema

**As a** developer building `AddExpenseModal`,  
**I want** an `ExpenseInput` type that omits the `id` field,  
**So that** I do not need to generate a UUID in the form — the DataStore handles that on insert.

**Acceptance criteria:**
- `ExpenseInputSchema` is exported from `src/schemas.ts`
- `ExpenseInputSchema` is `ExpenseSchema.omit({ id: true })`
- `ExpenseInput` type is inferred and exported
- Same pattern exists for `IncomeInputSchema` and `DebtInputSchema`

---

## Story 6 — Settings have typed defaults

**As a** developer reading plugin settings,  
**I want** a `PluginSettings` interface with a `DEFAULT_SETTINGS` constant,  
**So that** I can call `Object.assign(DEFAULT_SETTINGS, savedData)` and always have a fully typed settings object.

**Acceptance criteria:**
- `PluginSettings` interface exported from `src/types.ts`
- `DEFAULT_SETTINGS` constant exported with all fields populated
- `ledgerPath` defaults to `'finance-ledger.md'`
- `currency` defaults to `'XOF'`
