# Phase 2 — Parsing & DataStore: Validation Checklist

---

## Parser Unit Tests

Each of the following must pass in `src/__tests__/`:

### Expense Parser
- [ ] Parses `- [food] 15000 XOF @ market: rice and vegetables` → `{ type: 'food', amount: 1500000, currency: 'XOF', location: 'market', note: 'rice and vegetables' }`
- [ ] Parses line without location → `location` is `undefined`
- [ ] Amount is stored as cents: `15000` in markdown → `1500000` in object
- [ ] Unknown type `[luxury]` → `errors` contains one `ParseError`, expenses array excludes that line
- [ ] Expense line before any `### date` heading → `ParseError` with message containing "date"
- [ ] Note containing `:` is captured correctly (e.g., `note: 09:00 meeting snack`)
- [ ] Note containing `@` is captured correctly (e.g., `note: transfer @ bank`)

### Income Parser
- [ ] Parses `- [salary] 150000 XOF from: April freelance work` correctly
- [ ] `source` field populated from text after `from:`
- [ ] Unknown income type → `ParseError`

### Debt Parser
- [ ] Parses full debt line with all fields
- [ ] `status` defaults to `'open'` when absent
- [ ] `interestRate` is `undefined` when absent
- [ ] `interestRate: 5.0` is parsed as `number` `5.0`
- [ ] Invalid `due` date format → `ParseError`

---

## DataStore Unit Tests

- [ ] `addExpense(input)` returns object with `id` (UUID format)
- [ ] `getExpenses()` returns the added expense
- [ ] `getExpensesByDate('2026-04-25')` returns only expenses on that date
- [ ] `getExpensesByType('food')` returns only food expenses
- [ ] `deleteExpense(id)` removes the record; subsequent `getExpenses()` does not include it
- [ ] `updateExpense(id, { note: 'updated' })` changes only the note field
- [ ] `getMonthlyExpenseTotal(2026, 4)` returns sum in cents of all April 2026 expenses
- [ ] `getExpenseSummaryByType(2026, 4)` returns `Record<ExpenseType, number>` with correct sums
- [ ] `subscribe(fn)` — `fn` is called after `addExpense`
- [ ] Returned unsubscribe function stops `fn` from being called
- [ ] Listener that throws does not break other listeners

---

## MarkdownSerializer Tests

- [ ] `deserialize(validLedger)` returns zero errors and correct records
- [ ] `deserialize('')` returns empty ledger and zero errors
- [ ] `deserialize(contentMissingIncomeSectionn)` returns empty incomes, no error
- [ ] `serialize(store, meta)` contains `## Expenses` section
- [ ] `serialize(store, meta)` dates sorted descending
- [ ] `serialize(store, meta)` debts sorted ascending by dueDate
- [ ] `serialize(store, meta)` output has no trailing whitespace on any line
- [ ] Calling `serialize` twice produces identical strings

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

- [ ] Round-trip test passes for expenses
- [ ] Round-trip test passes for incomes
- [ ] Round-trip test passes for debts

---

## FileWatcher Tests (manual — requires Obsidian vault)

- [ ] Externally modifying the ledger file triggers `onExternalChange` callback within 600ms
- [ ] Plugin writing the file does NOT trigger `onExternalChange`
- [ ] Rapid external writes (3 in 200ms) trigger exactly one `onExternalChange`

---

## Phase Exit Criteria

- [ ] All parser unit tests pass
- [ ] All DataStore unit tests pass
- [ ] All MarkdownSerializer tests pass
- [ ] Round-trip test passes for all three record types
- [ ] `tsc --noEmit --strict` clean on all Phase 2 files
- [ ] No `any` in any of the seven new files
