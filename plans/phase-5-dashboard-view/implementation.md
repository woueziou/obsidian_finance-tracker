# Phase 5 — Dashboard View: Implementation Plan

## View Registration in `main.ts`

```typescript
import { DASHBOARD_VIEW_TYPE, DashboardView } from './views/DashboardView';

// In onload():
this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this));

this.addRibbonIcon('bar-chart-2', 'Open Dashboard', () => this.activateDashboard());

this.addCommand({
  id: 'open-dashboard',
  name: 'Open Dashboard',
  callback: () => this.activateDashboard(),
});

async activateDashboard(): Promise<void> {
  const { workspace } = this.app;
  let leaf = workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE)[0];
  if (!leaf) {
    leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
    await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
  }
  workspace.revealLeaf(leaf);
}
```

---

## `DashboardView.ts` Skeleton

```typescript
import { ItemView, WorkspaceLeaf } from 'obsidian';
import type FinanceTrackerPlugin from '../main';

export const DASHBOARD_VIEW_TYPE = 'finance-tracker-dashboard';

export class DashboardView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private chartInstances: Chart[] = [];

  constructor(leaf: WorkspaceLeaf, private plugin: FinanceTrackerPlugin) {
    super(leaf);
  }

  getViewType(): string { return DASHBOARD_VIEW_TYPE; }
  getDisplayText(): string { return 'Finance Dashboard'; }
  getIcon(): string { return 'bar-chart-2'; }

  async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.store.subscribe(() => this.render());
    await this.loadChartJs();
    await this.render();
  }

  async onClose(): Promise<void> {
    this.chartInstances.forEach(c => c.destroy());
    this.chartInstances = [];
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
```

---

## `render()` Method

```typescript
private async render(): Promise<void> {
  const { containerEl } = this;
  containerEl.empty();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const totalExpenses = this.plugin.store.getMonthlyExpenseTotal(year, month);
  const totalIncome   = this.plugin.store.getMonthlyIncomeTotal(year, month);
  const expByType     = this.plugin.store.getExpenseSummaryByType(year, month);
  const openDebts     = this.plugin.store.getOpenDebts();

  const currency = this.plugin.settings.currency;

  // Header
  containerEl.createEl('h4', { text: `Dashboard — ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}` });

  // Stats grid
  const grid = containerEl.createEl('div', { cls: 'finance-stats-grid' });
  this.addStat(grid, 'Expenses', formatAmount(totalExpenses, currency));
  this.addStat(grid, 'Income',   formatAmount(totalIncome,   currency));
  this.addStat(grid, 'Balance',  formatAmount(totalIncome - totalExpenses, currency));
  this.addStat(grid, 'Open Debts', `${openDebts.length} item(s)`);

  // Expense breakdown chart
  if (window.Chart && Object.keys(expByType).length > 0) {
    const canvas = containerEl.createEl('canvas', { attr: { height: '200' } });
    const chart = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(expByType),
        datasets: [{ data: Object.values(expByType).map(v => v / 100) }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
    this.chartInstances.push(chart);
  }

  // Quick add buttons
  const btnRow = containerEl.createEl('div', { cls: 'finance-btn-row' });
  const addBtn = (label: string, cb: () => void) => {
    const b = btnRow.createEl('button', { text: label, cls: 'mod-cta' });
    b.addEventListener('click', cb);
  };
  addBtn('+ Expense', () => openAddExpenseModal(this.app, this.plugin));
  addBtn('+ Income',  () => openAddIncomeModal(this.app, this.plugin));
  addBtn('+ Debt',    () => openAddDebtModal(this.app, this.plugin));
}
```

---

## `loadChartJs()`

```typescript
private async loadChartJs(): Promise<void> {
  if ((window as Window & { Chart?: unknown }).Chart) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    script.onload  = () => resolve();
    script.onerror = () => {
      console.warn('[Finance Tracker] Chart.js failed to load — charts disabled');
      resolve(); // resolve, not reject — dashboard still usable without charts
    };
    document.head.appendChild(script);
  });
}
```

Failing to load Chart.js is non-fatal — the dashboard shows numbers without charts.

---

## `LedgerView.ts` — Ledger Table

Shows all expenses in a filterable table:

```
| Date | Type | Amount | Note | Location |
|---|---|---|---|---|
| 2026-04-25 | food | 15,000 XOF | rice | market |
```

Implementation:
- Build `<table>` with `<thead>` + `<tbody>` using `createEl`
- Filter controls above table: date range inputs + type dropdown
- Filter state stored as instance fields; `renderTable()` re-reads and re-renders `<tbody>`

---

## CSS (`styles.css` additions)

```css
.finance-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.finance-stat-card {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--background-secondary);
}

.finance-stat-label {
  font-size: 0.75em;
  color: var(--text-muted);
}

.finance-stat-value {
  font-size: 1.1em;
  font-weight: 600;
}

.finance-btn-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
```
