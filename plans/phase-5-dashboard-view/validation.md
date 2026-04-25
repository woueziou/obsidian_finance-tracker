# Phase 5 — Dashboard View: Validation Checklist

---

## Build

- [ ] `tsc --noEmit --strict` clean on `src/views/`
- [ ] No `any` in view files
- [ ] No Chart.js types causing `any` leakage (use type assertion or declare global)

---

## Dashboard Opens

- [ ] Clicking the `bar-chart-2` ribbon icon opens the dashboard panel
- [ ] "Finance Tracker: Open Dashboard" command opens the panel
- [ ] If the panel is already open, the command/button focuses it rather than opening a second
- [ ] Panel title displays "Finance Dashboard"

---

## Data Accuracy (populate ledger first, then open dashboard)

Seed the ledger with:
- 3 expenses in the current month: 15000 food, 3000 subscription, 2000 transport
- 1 income in the current month: 150000 salary
- 1 open debt

Then verify:
- [ ] Expense total shows 20,000 XOF (or equivalent)
- [ ] Income total shows 150,000 XOF
- [ ] Balance shows +130,000 XOF
- [ ] Open debts shows 1

---

## Chart Rendering

- [ ] Doughnut chart appears when there are expenses
- [ ] Chart shows correct category labels (food, subscription, transport)
- [ ] Chart proportions are visually plausible (food ~75%, subscription ~15%, transport ~10%)
- [ ] No console errors related to Chart.js
- [ ] Chart does not appear when there are zero expenses for the month

---

## Offline Graceful Degradation

Simulate offline by blocking CDN (Dev Tools → Network → block `cdn.jsdelivr.net`):
- [ ] Dashboard still opens without crashing
- [ ] Stat cards (numbers) are still displayed
- [ ] No uncaught errors in the console
- [ ] A warning appears in the console about Chart.js failing to load

---

## Live Updates

- [ ] Add an expense via modal while dashboard is open
- [ ] Dashboard totals update within 500ms without any manual action
- [ ] Chart updates to reflect the new category (or larger slice)
- [ ] No duplicate stat cards or chart instances accumulate on re-render

---

## Memory Leak Check

- [ ] Open dashboard, add several records, observe no error about "Canvas already in use"
- [ ] Close dashboard panel (click X), reopen — no errors
- [ ] Close and reopen 5 times — no errors, no performance degradation

---

## Phase Exit Criteria

- [ ] Dashboard opens from ribbon and command
- [ ] All four stat cards show correct data
- [ ] Chart renders (when online)
- [ ] Dashboard updates live after record addition
- [ ] No memory leaks from charts or subscriptions
- [ ] `tsc --noEmit --strict` clean
