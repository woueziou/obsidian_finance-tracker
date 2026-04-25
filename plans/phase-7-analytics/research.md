# Phase 7 — Analytics: Research

## Computing Month Ranges

### Days in a month
```typescript
new Date(year, month, 0).getDate()
// new Date(2026, 4, 0) → April 30 (month=4 is May, day=0 rolls back to April's last day)
```

### Last N months (going backwards from now)
```typescript
const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
// When `now.getMonth() - i` is negative, JS Date auto-wraps to the previous year
// e.g., new Date(2026, -1, 1) → December 2025
```

This works correctly without manual year/month arithmetic.

### Days elapsed in current month
```typescript
const today = new Date();
const daysElapsed = today.getDate(); // 1–31
```

---

## Average Daily Spending

For a month that's still in progress (current month), divide total by days elapsed, not by total days in the month. This gives a meaningful "current pace" rather than an artificially low number.

Example: 30,000 XOF spent over 10 days → avg 3,000/day. If we divided by 30 (full month), we'd get 1,000/day — misleading.

For past months, use full days in month.

---

## Sorting by Amount (Descending)

```typescript
Object.entries(summaryRecord)
  .sort(([, a], [, b]) => b - a)  // descending by value
  .slice(0, n)
  .map(([key, value]) => ({ type: key, amount: value }))
```

TypeScript may warn about `[, a]` destructuring. Use `[_key, a]` if needed.

---

## Chart.js Bar Chart: Grouped vs Stacked

Default bar chart is grouped (side-by-side). To stack income and expenses in the same bar:

```javascript
options: {
  scales: {
    x: { stacked: true },
    y: { stacked: true },
  }
}
```

Stacked is harder to read for comparison. Use grouped (default) for income vs expenses.

---

## Debt "Overdue" Detection

```typescript
const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
const overdue = debt.dueDate < today; // string comparison works for ISO dates
```

ISO date string comparison (`<`, `>`) is lexicographically valid because the format is `YYYY-MM-DD` — the most significant unit is leftmost.

---

## Pure Function Design for Analytics

All analytics functions should be pure: given the same store contents and same arguments, they always return the same result. No side effects, no module-level state.

Benefits:
- Unit-testable without mocking
- Re-callable on every render without hidden state issues
- Composable (e.g., `getTopExpenseCategories` calls `getExpenseSummaryByType` internally via DataStore)

Pattern:
```typescript
// Good — pure, injectable
function getAverageDailySpending(store: DataStore, year: number, month: number): number

// Bad — captures module state
let currentStore: DataStore;
function getAverageDailySpending(): number  // depends on currentStore
```

---

## Intl.DateTimeFormat for Month Labels

```typescript
const label = new Date(year, month - 1, 1).toLocaleString('default', {
  month: 'short',   // 'Apr'
  year:  '2-digit', // '26'
});
// 'Apr 26'
```

`'default'` uses the browser/system locale. This is fine for charts — the label is for display only.

---

## Handling Empty Months in Trend Data

When a month has no expenses, `getMonthlyExpenseTotal()` returns `0`. The trend array must always contain all N months — never skip months with zero data — otherwise the chart x-axis labels won't align with the data points.

Verify: `getMonthlyTrend(store, 6).length === 6` always.
