# Phase 5 — Dashboard View: ganfam Review

## Verdict

PASS WITH WARNINGS

The dashboard is fully functional. Two bugs that were present at initial review have been corrected. Two plan gaps remain: the doughnut chart from the implementation plan was not built (replaced by a line chart), and `getMonthlyIncomeTotal` is dead code. Neither is a blocker for shipping.

---

## Bugs Found and Fixed

- `src/views/DashboardView.ts` line 231 — line color was inverted: negative balance rendered green and positive rendered red. Fixed: positive balance now uses `#4caf7d`, negative uses `#e05c5c`.
- `src/views/DashboardView.ts` — amount `<td>` had an unused CSS class `finance-tx-amount` applied directly to the cell instead of the inner `<span>`. Removed. The `<span>` already carries `finance-tx-neg` / `finance-tx-pos`.
- `src/main.ts` — "Open Ledger" ribbon icon and `activateLedger()` command were missing. Both have been added (ribbon icon `list`, command id `open-ledger`).

---

## Plan Gaps

### No doughnut chart — User Story 2 unfulfilled

`implementation.md` specifies a doughnut chart showing expense breakdown by category. The built dashboard shows a line chart (cumulative net worth) instead. There is no doughnut chart anywhere in the codebase.

User Story 2 ("As a user I want to see which category I spend the most on") cannot be completed with the current implementation.

Suggested fix: add a doughnut chart section in `renderNetWorthSection` or as a separate `renderExpenseBreakdown` method, using `store.getExpenseSummaryByType(year, month)`. The data method already exists in `DataStore`.

### `getMonthlyIncomeTotal` is dead code

`DataStore.getMonthlyIncomeTotal(year, month)` at line 174 of `src/store/DataStore.ts` is defined but never called. `DashboardView.renderStats` computes income totals inline by iterating `store.getIncomes()` with a date-range string comparison instead of calling this method.

The method is not harmful to ship, but it represents unused surface area. Either delete it or refactor `renderStats` to call it. Note also that the method parses ISO date strings with `new Date(i.date)` which applies local timezone offset, while `renderStats` compares date strings lexicographically — these two approaches will disagree for users whose local timezone is behind UTC (dates near midnight will shift by one day with `new Date()`).

Suggested fix (option A): delete `getMonthlyIncomeTotal` from `DataStore.ts`.
Suggested fix (option B): keep it but fix the timezone issue — parse the date without timezone conversion: `const [y, m] = i.date.split('-').map(Number); return y === year && m === month;`

---

## TypeScript Issues

None. `tsc --noEmit --strict` was clean at the time of the previous validation pass and no new files were added in these fixes.

---

## Remaining Warnings

- `validation.md` items under "Chart Rendering" reference a doughnut chart. These will remain manually unverifiable as `- [ ]` because the doughnut was not built.
- All manual Obsidian tests (dashboard opens, live updates, memory leak checks) remain marked `(manual)` — they cannot be verified by static analysis.

---

## Doc References Used

None required for this targeted fix review.
