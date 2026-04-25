# Phase 7 — Analytics: Implementation Plan

## File to Create

```
src/utils/analytics.ts
```

---

## Core Functions

### `getLastNMonths(n: number): Array<{ year: number; month: number; label: string }>`

```typescript
export function getLastNMonths(n: number) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
    });
  }
  return result;
}
```

---

### `getMonthlyTrend(store: DataStore, n: number): MonthlyTrend[]`

```typescript
export interface MonthlyTrend {
  label: string;
  expenses: number;  // cents
  income: number;    // cents
}

export function getMonthlyTrend(store: DataStore, n = 6): MonthlyTrend[] {
  return getLastNMonths(n).map(({ year, month, label }) => ({
    label,
    expenses: store.getMonthlyExpenseTotal(year, month),
    income:   store.getMonthlyIncomeTotal(year, month),
  }));
}
```

Months with zero data return `{ expenses: 0, income: 0 }` — never skip or omit.

---

### `getAverageDailySpending(store: DataStore, year: number, month: number): number`

```typescript
export function getAverageDailySpending(store: DataStore, year: number, month: number): number {
  const total = store.getMonthlyExpenseTotal(year, month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  // If current month, divide by days elapsed (not full month)
  const daysElapsed = (year === today.getFullYear() && month === today.getMonth() + 1)
    ? today.getDate()
    : daysInMonth;
  return daysElapsed > 0 ? Math.round(total / daysElapsed) : 0;
}
```

---

### `getTopExpenseCategories(store: DataStore, year: number, month: number, n = 3): Array<{ type: ExpenseType; amount: number }>`

```typescript
export function getTopExpenseCategories(store: DataStore, year: number, month: number, n = 3) {
  const summary = store.getExpenseSummaryByType(year, month);
  return Object.entries(summary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([type, amount]) => ({ type: type as ExpenseType, amount }));
}
```

---

### `getDebtProgress(store: DataStore): DebtProgress[]`

```typescript
export interface DebtProgress {
  person: string;
  total: number;     // original amount (cents)
  remaining: number; // amount not yet paid (for partial: this equals total for now)
  status: DebtStatus;
  dueDate: string;
  overdue: boolean;
}

export function getDebtProgress(store: DataStore): DebtProgress[] {
  const today = new Date().toISOString().slice(0, 10);
  return store.getDebts()
    .filter(d => d.status !== 'paid')
    .map(d => ({
      person:    d.person,
      total:     d.amount,
      remaining: d.status === 'paid' ? 0 : d.amount,
      status:    d.status,
      dueDate:   d.dueDate,
      overdue:   d.dueDate < today,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
```

---

## Chart: 6-Month Income vs Expense Bar

Add to `ChartView.ts` or a new analytics section in `DashboardView.ts`:

```typescript
const trend = getMonthlyTrend(this.plugin.store, 6);

new window.Chart(canvas, {
  type: 'bar',
  data: {
    labels: trend.map(t => t.label),
    datasets: [
      {
        label: 'Income',
        data: trend.map(t => t.income / 100),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Expenses',
        data: trend.map(t => t.expenses / 100),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } },
  },
});
```

---

## Chart: Expense Trend (Line)

```typescript
new window.Chart(canvas, {
  type: 'line',
  data: {
    labels: trend.map(t => t.label),
    datasets: [{
      label: 'Expenses',
      data: trend.map(t => t.expenses / 100),
      borderColor: 'rgba(255, 99, 132, 1)',
      tension: 0.3,
      fill: false,
    }],
  },
});
```

---

## Debt Progress Bars (HTML, no Chart.js)

```typescript
const debts = getDebtProgress(this.plugin.store);
const container = contentEl.createEl('div');

for (const d of debts) {
  const row = container.createEl('div', { cls: 'debt-row' });
  row.createEl('span', { text: `${d.person} — ${formatAmount(d.total, currency)}` });
  if (d.overdue) row.createEl('span', { text: ' ⚠ Overdue', cls: 'debt-overdue' });
  const bar = row.createEl('div', { cls: 'debt-progress-bar' });
  const fill = bar.createEl('div', {
    cls: `debt-progress-fill ${d.status === 'partial' ? 'partial' : 'open'}`,
    attr: { style: 'width: 100%' },  // MVP: no partial amount tracking
  });
}
```

---

## `analytics.ts` exports

```typescript
export {
  getLastNMonths,
  getMonthlyTrend,
  getAverageDailySpending,
  getTopExpenseCategories,
  getDebtProgress,
};
export type { MonthlyTrend, DebtProgress };
```

No classes, only pure functions. All inputs are passed explicitly — no module-level state.
