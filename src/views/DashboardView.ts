import { ItemView, WorkspaceLeaf } from 'obsidian';
import type FinanceTrackerPlugin from '../main';
import type { DashboardTransaction } from '../store/DataStore';
import { AddExpenseModal } from '../commands/addExpense';
import { AddIncomeModal } from '../commands/addIncome';
import { AddDebtModal } from '../commands/addDebt';

export const DASHBOARD_VIEW_TYPE = 'finance-tracker-dashboard';

// ---------------------------------------------------------------------------
// Ambient types for window.Chart loaded from CDN
// ---------------------------------------------------------------------------

type ChartType = 'line' | 'bar' | 'doughnut';

interface ChartDataset {
  data: number[];
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

interface ChartConfig {
  type: ChartType;
  data: { labels: string[]; datasets: ChartDataset[] };
  options?: Record<string, unknown>;
}

interface ChartInstance { destroy(): void; }
interface ChartConstructor { new (canvas: HTMLCanvasElement, config: ChartConfig): ChartInstance; }

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

type Period = 'daily' | 'weekly' | 'monthly';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function periodRange(period: Period, anchorFrom: string, anchorTo: string): { from: string; to: string } {
  if (period === 'daily') {
    const today = isoDate(new Date());
    return { from: today, to: today };
  }
  if (period === 'weekly') {
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - ((dow + 6) % 7));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: isoDate(mon), to: isoDate(sun) };
  }
  if (period === 'monthly') {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from, to: isoDate(last) };
  }
  return { from: anchorFrom, to: anchorTo };
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

// ---------------------------------------------------------------------------
// DashboardView
// ---------------------------------------------------------------------------

export class DashboardView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private chartInstances: ChartInstance[] = [];
  private period: Period = 'monthly';
  private fromDate: string = isoDate(new Date());
  private toDate: string   = isoDate(new Date());

  constructor(leaf: WorkspaceLeaf, private plugin: FinanceTrackerPlugin) {
    super(leaf);
    const range = periodRange('monthly', this.fromDate, this.toDate);
    this.fromDate = range.from;
    this.toDate   = range.to;
  }

  override getViewType(): string   { return DASHBOARD_VIEW_TYPE; }
  override getDisplayText(): string { return 'Finance Dashboard'; }
  override getIcon(): string        { return 'bar-chart-2'; }

  override async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.store.subscribe(() => { void this.render(); });
    await this.loadChartJs();
    await this.render();
  }

  override async onClose(): Promise<void> {
    this.destroyCharts();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  private async render(): Promise<void> {
    this.destroyCharts();
    const { containerEl } = this;
    containerEl.empty();

    const { from, to } = { from: this.fromDate, to: this.toDate };
    const currency = this.plugin.settings.currency;

    // Wrapper with padding
    const wrap = containerEl.createEl('div', { cls: 'finance-dash-wrap' });

    // ── Period toolbar ────────────────────────────────────────────────────────
    this.renderToolbar(wrap);

    // ── Summary stats ─────────────────────────────────────────────────────────
    this.renderStats(wrap, from, to, currency);

    // ── Net Worth chart ───────────────────────────────────────────────────────
    this.renderNetWorthSection(wrap, from, to, currency);

    // ── Recent transactions ───────────────────────────────────────────────────
    this.renderTransactionsSection(wrap, from, to, currency);

    // ── Quick-add buttons ─────────────────────────────────────────────────────
    this.renderQuickAdd(wrap);
  }

  // ---------------------------------------------------------------------------
  // Toolbar: Daily / Weekly / Monthly + date pickers
  // ---------------------------------------------------------------------------

  private renderToolbar(parent: HTMLElement): void {
    const bar = parent.createEl('div', { cls: 'finance-dash-toolbar' });

    const toggleGroup = bar.createEl('div', { cls: 'finance-period-toggle' });
    const periods: Period[] = ['daily', 'weekly', 'monthly'];
    for (const p of periods) {
      const btn = toggleGroup.createEl('button', {
        text: p.charAt(0).toUpperCase() + p.slice(1),
        cls: `finance-period-btn${this.period === p ? ' is-active' : ''}`,
      });
      btn.addEventListener('click', () => {
        this.period = p;
        const range = periodRange(p, this.fromDate, this.toDate);
        this.fromDate = range.from;
        this.toDate   = range.to;
        void this.render();
      });
    }

    const dateGroup = bar.createEl('div', { cls: 'finance-date-range' });
    const fromInput = dateGroup.createEl('input', { attr: { type: 'date', value: this.fromDate } });
    dateGroup.createEl('span', { text: '→', cls: 'finance-date-arrow' });
    const toInput = dateGroup.createEl('input', { attr: { type: 'date', value: this.toDate } });

    fromInput.addEventListener('change', () => {
      this.fromDate = (fromInput as HTMLInputElement).value;
      void this.render();
    });
    toInput.addEventListener('change', () => {
      this.toDate = (toInput as HTMLInputElement).value;
      void this.render();
    });
  }

  // ---------------------------------------------------------------------------
  // Summary stats row
  // ---------------------------------------------------------------------------

  private renderStats(parent: HTMLElement, from: string, to: string, currency: string): void {
    const store = this.plugin.store;

    let totalExp = 0, totalInc = 0;
    for (const e of store.getExpenses()) {
      if (e.date >= from && e.date <= to) totalExp += e.amount;
    }
    for (const i of store.getIncomes()) {
      if (i.date >= from && i.date <= to) totalInc += i.amount;
    }
    const balance   = totalInc - totalExp;
    const openDebts = store.getOpenDebts().length;

    const grid = parent.createEl('div', { cls: 'finance-stats-grid' });
    this.addStat(grid, 'Income',     formatAmount(totalInc,  currency), 'finance-stat--income');
    this.addStat(grid, 'Expenses',   formatAmount(totalExp,  currency), 'finance-stat--expense');
    this.addStat(grid, 'Balance',    formatAmount(balance,   currency), balance >= 0 ? 'finance-stat--positive' : 'finance-stat--negative');
    this.addStat(grid, 'Open Debts', `${openDebts} item${openDebts !== 1 ? 's' : ''}`, '');
  }

  // ---------------------------------------------------------------------------
  // Net Worth section
  // ---------------------------------------------------------------------------

  private renderNetWorthSection(parent: HTMLElement, from: string, to: string, currency: string): void {
    const section = parent.createEl('div', { cls: 'finance-dash-section' });
    section.createEl('h3', { text: 'Net Worth', cls: 'finance-dash-section-title' });
    section.createEl('p', { text: 'Cumulative income minus expenses', cls: 'finance-dash-section-subtitle' });

    const { labels, data } = this.plugin.store.getCumulativeBalance(from, to);
    const ChartCtor = (window as Window & { Chart?: ChartConstructor }).Chart;

    if (!ChartCtor) {
      section.createEl('p', { text: 'Chart.js unavailable — charts disabled.', cls: 'finance-dash-empty' });
      return;
    }
    if (labels.length === 0) {
      section.createEl('p', { text: 'No data for this period.', cls: 'finance-dash-empty' });
      return;
    }

    const canvasWrap = section.createEl('div', { cls: 'finance-chart-wrap' });
    const canvas = canvasWrap.createEl('canvas');
    const lastVal = data[data.length - 1] ?? 0;
    const lineColor = lastVal >= 0 ? '#4caf7d' : '#e05c5c';

    const chart = new ChartCtor(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Balance (${currency})`,
          data,
          borderColor: lineColor,
          backgroundColor: `${lineColor}22`,
          fill: true,
          tension: 0.35,
          pointRadius: labels.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxTicksLimit: 7, maxRotation: 0 } },
          y: { ticks: { callback: (v: unknown) => `${Number(v).toLocaleString()} ${currency}` } },
        },
      },
    });
    this.chartInstances.push(chart);
  }

  // ---------------------------------------------------------------------------
  // Transactions section
  // ---------------------------------------------------------------------------

  private renderTransactionsSection(parent: HTMLElement, from: string, to: string, currency: string): void {
    const section = parent.createEl('div', { cls: 'finance-dash-section' });
    section.createEl('h3', { text: 'Last 10 Transactions', cls: 'finance-dash-section-title' });
    section.createEl('p', { text: 'Expenses and income for selected dates', cls: 'finance-dash-section-subtitle' });

    const rows = this.plugin.store.getRecentTransactions(from, to, 10);

    if (rows.length === 0) {
      section.createEl('p', { text: 'No transactions for this period.', cls: 'finance-dash-empty' });
      return;
    }

    const table = section.createEl('table', { cls: 'finance-tx-table' });
    const thead = table.createEl('thead');
    const headRow = thead.createEl('tr');
    for (const h of ['Date', 'Note', 'Amount', 'Type', 'Kind']) {
      headRow.createEl('th', { text: h });
    }

    const tbody = table.createEl('tbody');
    for (const row of rows) {
      this.renderTxRow(tbody, row, currency);
    }
  }

  private renderTxRow(tbody: HTMLElement, row: DashboardTransaction, currency: string): void {
    const tr = tbody.createEl('tr', { cls: `finance-tx-row finance-tx-row--${row.kind}` });
    tr.createEl('td', { text: row.date });
    tr.createEl('td', { text: row.note || '—' });
    const amountCell = tr.createEl('td');
    amountCell.createEl('span', {
      text: (row.kind === 'expense' ? '−' : '+') + formatAmount(row.amount, currency),
      cls: row.kind === 'expense' ? 'finance-tx-neg' : 'finance-tx-pos',
    });
    tr.createEl('td', { text: row.type });
    const kindCell = tr.createEl('td');
    kindCell.createEl('span', { text: row.kind, cls: `finance-tx-badge finance-tx-badge--${row.kind}` });
  }

  // ---------------------------------------------------------------------------
  // Quick-add buttons
  // ---------------------------------------------------------------------------

  private renderQuickAdd(parent: HTMLElement): void {
    const section = parent.createEl('div', { cls: 'finance-dash-section finance-dash-quickadd' });
    section.createEl('h3', { text: 'Add Record', cls: 'finance-dash-section-title' });
    const row = section.createEl('div', { cls: 'finance-btn-row' });
    const btn = (label: string, cb: () => void): void => {
      const b = row.createEl('button', { text: label, cls: 'mod-cta' });
      b.addEventListener('click', cb);
    };
    btn('+ Expense', () => new AddExpenseModal(this.app, this.plugin).open());
    btn('+ Income',  () => new AddIncomeModal(this.app, this.plugin).open());
    btn('+ Debt',    () => new AddDebtModal(this.app, this.plugin).open());
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private addStat(parent: HTMLElement, label: string, value: string, modifier: string): void {
    const card = parent.createEl('div', { cls: `finance-stat-card${modifier ? ' ' + modifier : ''}` });
    card.createEl('div', { cls: 'finance-stat-label', text: label });
    card.createEl('div', { cls: 'finance-stat-value', text: value });
  }

  private destroyCharts(): void {
    this.chartInstances.forEach(c => c.destroy());
    this.chartInstances = [];
  }

  private async loadChartJs(): Promise<void> {
    if ((window as Window & { Chart?: unknown }).Chart) return;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
      script.onload  = () => resolve();
      script.onerror = () => {
        console.warn('[Finance Tracker] Chart.js failed to load — charts disabled');
        resolve();
      };
      document.head.appendChild(script);
    });
  }
}
