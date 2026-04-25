# Phase 2 — Parsing & DataStore: Validation Checklist

---

## Parser Unit Tests

Each of the following must pass in `src/__tests__/`:

### Expense Parser
- [x] Parses `- [food] 15000 XOF @ market: rice and vegetables` → `{ type: 'food', amount: 1500000, currency: 'XOF', location: 'market', note: 'rice and vegetables' }`
- [x] Parses line without location → `location` is `undefined`
- [x] Amount is stored as cents: `15000` in markdown → `1500000` in object
- [x] Unknown type `[luxury]` → `errors` contains one `ParseError`, expenses array excludes that line
- [x] Expense line before any `### date` heading → `ParseError` with message containing "date"
- [x] Note containing `:` is captured correctly (e.g., `note: 09:00 meeting snack`)
- [x] Note containing `@` is captured correctly (e.g., `note: transfer @ bank`)

### Income Parser
- [x] Parses `- [salary] 150000 XOF from: April freelance work` correctly
- [x] `source` field populated from text after `from:`
- [x] Unknown income type → `ParseError`

### Debt Parser
- [x] Parses full debt line with all fields
- [x] `status` defaults to `'open'` when absent
- [x] `interestRate` is `undefined` when absent
- [x] `interestRate: 5.0` is parsed as `number` `5.0`
- [ ] Invalid `due` date format → `ParseError` ❌ no test exists

---

## DataStore Unit Tests

- [x] `addExpense(input)` returns object with `id` (UUID format)
- [x] `getExpenses()` returns the added expense
- [x] `getExpensesByDate('2026-04-25')` returns only expenses on that date
- [x] `getExpensesByType('food')` returns only food expenses
- [x] `deleteExpense(id)` removes the record; subsequent `getExpenses()` does not include it
- [x] `updateExpense(id, { note: 'updated' })` changes only the note field
- [x] `getMonthlyExpenseTotal(2026, 4)` returns sum in cents of all April 2026 expenses
- [x] `getExpenseSummaryByType(2026, 4)` returns `Record<ExpenseType, number>` with correct sums
- [x] `subscribe(fn)` — `fn` is called after `addExpense`
- [x] Returned unsubscribe function stops `fn` from being called
- [x] Listener that throws does not break other listeners

---

## MarkdownSerializer Tests

- [x] `deserialize(validLedger)` returns zero errors and correct records
- [x] `deserialize('')` returns empty ledger and zero errors
- [x] `deserialize(contentMissingIncomeSectionn)` returns empty incomes, no error
- [x] `serialize(store, meta)` contains `## Expenses` section
- [x] `serialize(store, meta)` dates sorted descending
- [x] `serialize(store, meta)` debts sorted ascending by dueDate
- [x] `serialize(store, meta)` output has no trailing whitespace on any line ⚠️ tested for expenses only; income/debt paths not covered
- [x] Calling `serialize` twice produces identical strings

---

## Round-Trip Integration Test

```typescript
const original = `---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---

## Expenses

### 2026-04-25
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly

## Income

### 2026-04-25
- [salary] 150000 XOF from: April freelance work

## Debts

- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan`;

const { ledger } = MarkdownSerializer.deserialize(original);
const store = new DataStore();
store.load(ledger);
const serialized = MarkdownSerializer.serialize(store, ledger.meta);
const { ledger: reparsed } = MarkdownSerializer.deserialize(serialized);

// Field-by-field comparison (excluding id, which is re-generated)
assert expense amounts, dates, types, notes, locations match
assert income amounts, dates, types, notes, sources match
assert debt amounts, dueDates, persons, notes, statuses match
```

- [x] Round-trip test passes for expenses
- [x] Round-trip test passes for incomes
- [x] Round-trip test passes for debts

---

## FileWatcher Tests (manual — requires Obsidian vault)

- [ ] Externally modifying the ledger file triggers `onExternalChange` callback within 600ms (manual)
- [ ] Plugin writing the file does NOT trigger `onExternalChange` (manual)
- [ ] Rapid external writes (3 in 200ms) trigger exactly one `onExternalChange` (manual)

---

## Phase Exit Criteria

- [x] All parser unit tests pass
- [x] All DataStore unit tests pass
- [x] All MarkdownSerializer tests pass
- [x] Round-trip test passes for all three record types
- [x] `tsc --noEmit --strict` clean on all Phase 2 files
- [x] No `any` in any of the seven new files