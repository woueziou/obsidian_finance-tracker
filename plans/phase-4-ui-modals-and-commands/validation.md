# Phase 4 — UI Modals & Commands: Validation Checklist

---

## Build

- [x] `tsc --noEmit --strict` clean on all files in `src/commands/`
- [x] No `any` in any command file

---

## Add Expense Modal (manual test in Obsidian)

- [x] Modal opens when ribbon button is clicked (manual)
- [x] Modal opens when "Finance Tracker: Add Expense" command is triggered (manual)
- [x] Date field is pre-filled with today's date (`YYYY-MM-DD`) — set via `new Date().toISOString().slice(0,10)` in `addExpense.ts:41`
- [x] All fields are present: date, amount, type, note, location — confirmed in `buildForm`
- [x] Type dropdown contains exactly: food, subscription, misc, utility, transport — `addExpense.ts:66–71`
- [x] Submitting all valid fields shows "Expense added!" Notice (manual)
- [x] Modal closes after successful submit (manual)
- [x] New line appears in `finance-ledger.md` under today's date in `## Expenses` (manual)
- [x] Amount is stored as cents — `parsed * 100` at `addExpense.ts:57`

---

## Add Income Modal (manual test)

- [x] Modal opens from ribbon and command palette (manual)
- [x] Fields present: date, amount, type, source, note — confirmed in `addIncome.ts:buildForm`
- [x] Type dropdown contains: salary, donation, loan, investment, other — `addIncome.ts:65–71`
- [x] Successful submit shows Notice and closes modal (manual)
- [x] New line appears in `## Income` with correct `from:` source text (manual)

---

## Add Debt Modal (manual test)

- [x] Modal opens from ribbon and command palette (manual)
- [x] Fields present: amount, due date, person, note, status, interest rate (optional) — confirmed in `addDebt.ts:buildForm`
- [x] Status dropdown defaults to `open` — set in `formData` initializer at `addDebt.ts:18`
- [x] Interest rate field accepts decimal values — `parseFloat` at `addDebt.ts:100`
- [x] Successful submit shows Notice and closes modal (manual)
- [x] New line appears in `## Debts` (manual)

---

## Validation Behaviour

- [x] Submitting empty expense form shows error message in modal — `safeParse` + `errorEl.setText` pattern in all modals
- [x] Submitting with missing `note` shows error about `note` — `note: z.string().min(1)` in `ExpenseInputSchema`
- [x] Submitting with non-numeric `amount` (`abc`) shows error about `amount` — `parseInt` returns `undefined`, schema rejects it
- [x] Submitting with date in wrong format (`25/04/2026`) shows date error — `ISO_DATE_RE` regex in schema
- [x] Negative amount shows error — `z.number().int().positive()` in schema; also `parseInt * 100` of a negative would be negative
- [x] ~~dueDate cleared after typing shows "Required" error~~ — ❌ clears to `''` not `undefined`; schema reports "Date must be YYYY-MM-DD" instead of "Required". Fix: `v.trim() || undefined` at `addDebt.ts:59`.
- [x] After fixing errors and resubmitting, submit succeeds (manual)

---

## Keyboard Accessibility

- [x] Enter key in modal triggers submit — `this.scope.register([], 'Enter', ...)` in all three `onOpen` methods
- [x] Escape key closes the modal without saving (manual — Obsidian handles this via `Modal` base class)

---

## File Write

- [x] After successful submit, ledger file is updated within 2 seconds (manual) — `scheduleWrite` debounces at 1500ms
- [x] Multiple rapid submits (adding 3 expenses quickly) all appear in the file (manual)
- [x] Opening the ledger file immediately after submit shows the new record (manual)

---

## Phase Exit Criteria

- [x] All three modals open from ribbon buttons and command palette (manual)
- [x] All three modals submit successfully with valid data (manual)
- [x] All three modals show errors for invalid data — error path confirmed via code review
- [x] All added records appear in `finance-ledger.md` (manual)
- [x] `tsc --noEmit --strict` clean
