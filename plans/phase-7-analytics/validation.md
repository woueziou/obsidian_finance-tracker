# Phase 7 — Analytics: Validation Checklist

---

## Unit Tests for `analytics.ts`

### `getLastNMonths`
- [ ] `getLastNMonths(6).length === 6`
- [ ] First entry is 5 months ago; last entry is current month
- [ ] Works correctly when called in January (crosses year boundary)
- [ ] Each entry has `year`, `month`, `label` fields

### `getMonthlyTrend`
- [ ] Returns array of length `n`
- [ ] Month with no expenses returns `{ expenses: 0, income: 0 }`
- [ ] Expenses and income values match `store.getMonthlyExpenseTotal()` for the same month
- [ ] Never returns fewer than `n` entries (empty months not skipped)

### `getAverageDailySpending`
- [ ] For current month with 30,000 XOF over 10 days → 3,000 XOF/day
- [ ] For a past month with 30,000 XOF and 30 days → 1,000 XOF/day
- [ ] For a month with 0 expenses → returns 0 (no divide-by-zero)

### `getTopExpenseCategories`
- [ ] Returns at most `n` entries
- [ ] Sorted descending by amount
- [ ] Categories with 0 expenses in the period are excluded
- [ ] Returns empty array when no expenses exist

### `getDebtProgress`
- [ ] Paid debts are excluded
- [ ] Overdue debts have `overdue: true`
- [ ] Result sorted by `dueDate` ascending
- [ ] Returns empty array when no open debts

---

## Chart Rendering (manual test in Obsidian)

Seed data: 3 months of expenses and income.

- [ ] 6-month bar chart renders with 6 bars per group
- [ ] Months with no data show 0-height bars (not absent)
- [ ] Income bars and expense bars use visually distinct colors
- [ ] Line chart shows correct trend direction (upward if spending increased)
- [ ] No console errors during chart render
- [ ] Charts destroyed cleanly on view close (no "Canvas already in use" on reopen)

---

## Debt Progress Bars (manual test)

Seed 1 open debt (future due date), 1 partial debt (past due date — overdue), 1 paid debt.

- [ ] Two rows shown (open + partial) — paid debt not shown
- [ ] Overdue partial debt shows "⚠ Overdue" indicator
- [ ] Rows sorted by due date (earliest first)

---

## Dashboard Stat Cards

- [ ] "Avg. daily spending" stat card appears in dashboard
- [ ] Value is correct for current month (spot-check manually)
- [ ] "Top categories" list shows at most 3 categories, in descending order

---

## Phase Exit Criteria

- [ ] All `analytics.ts` unit tests pass
- [ ] Charts render correctly with real multi-month data
- [ ] Debt progress section renders and correctly marks overdue debts
- [ ] `analytics.ts` has zero Obsidian API imports
- [ ] `tsc --noEmit --strict` clean on `src/utils/analytics.ts`
