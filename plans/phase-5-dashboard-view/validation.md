# Phase 5 — Dashboard View: Validation Checklist

---

## Build

- [x] `tsc --noEmit --strict` clean on `src/views/`
- [x] No `any` in view files
- [x] No Chart.js types causing `any` leakage (use type assertion or declare global)

---

## Dashboard Opens

- [ ] Clicking the `bar-chart-2` ribbon icon opens the dashboard panel (manual)
- [ ] "Finance Tracker: Open Dashboard" command opens the panel (manual)
- [ ] If the panel is already open, the command/button focuses it rather than opening a second (manual)
- [ ] Panel title displays "Finance Dashboard" (manual)

---

## Data Accuracy (populate ledger first, then open dashboard)

Seed the ledger with:
- 3 expenses in the current month: 15000 food, 3000 subscription, 2000 transport
- 1 income in the current month: 150000 salary
- 1 open debt

Then verify:
- [ ] Expense total shows 20,000 XOF (or equivalent) (manual)
- [ ] Income total shows 150,000 XOF (manual)
- [ ] Balance shows +130,000 XOF (manual)
- [ ] Open debts shows 1 (manual)

---

## Chart Rendering

- [ ] ~~Doughnut chart appears when there are expenses~~ — ❌ doughnut chart not implemented; a line (net worth) chart was built instead; Story 2 unfulfilled
- [ ] ~~Chart shows correct category labels (food, subscription, transport)~~ — ❌ no doughnut, category breakdown not shown
- [ ] ~~Chart proportions are visually plausible (food ~75%, subscription ~15%, transport ~10%)~~ — ❌ no doughnut
- [ ] No console errors related to Chart.js (manual)
- [ ] ~~Chart does not appear when there are zero expenses for the month~~ — ❌ not applicable without doughnut; line chart correctly shows empty state via text message

---

## Offline Graceful Degradation

Simulate offline by blocking CDN (Dev Tools → Network → block `cdn.jsdelivr.net`):
- [ ] Dashboard still opens without crashing (manual)
- [ ] Stat cards (numbers) are still displayed (manual)
- [ ] No uncaught errors in the console (manual)
- [x] A warning appears in the console about Chart.js failing to load — `loadChartJs` resolves on `onerror` and logs `console.warn('[Finance Tracker] Chart.js failed to load — charts disabled')`

---

## Live Updates

- [ ] Add an expense via modal while dashboard is open (manual)
- [ ] Dashboard totals update within 500ms without any manual action (manual)
- [ ] Chart updates to reflect the new category (or larger slice) (manual)
- [ ] No duplicate stat cards or chart instances accumulate on re-render (manual)

---

## Memory Leak Check

- [ ] Open dashboard, add several records, observe no error about "Canvas already in use" (manual)
- [ ] Close dashboard panel (click X), reopen — no errors (manual)
- [ ] Close and reopen 5 times — no errors, no performance degradation (manual)

---

## Phase Exit Criteria

- [x] Dashboard opens from ribbon and command — ribbon icon and command registered in `main.ts`
- [ ] All four stat cards show correct data (manual)
- [ ] ~~Chart renders (when online)~~ — ❌ line chart renders; doughnut chart (plan spec) not implemented
- [ ] Dashboard updates live after record addition (manual)
- [ ] No memory leaks from charts or subscriptions (manual)
- [x] `tsc --noEmit --strict` clean
