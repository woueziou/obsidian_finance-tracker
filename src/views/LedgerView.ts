import { ItemView, WorkspaceLeaf } from 'obsidian';
import type FinanceTrackerPlugin from '../main';
import type { Expense } from '../schemas';

export const LEDGER_VIEW_TYPE = 'finance-tracker-ledger';

const TYPE_ICONS: Record<Expense['type'], string> = {
  food:         '🍽',
  subscription: '📦',
  transport:    '🚌',
  utility:      '⚡',
  misc:         '🗂',
};

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('fr-TG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function relativeDateLabel(date: string): string {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (date === today)     return 'Today';
  if (date === yesterday) return 'Yesterday';
  return date;
}

export class LedgerView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private filterType: Expense['type'] | '' = '';
  private filterFrom = '';
  private filterTo   = '';

  constructor(leaf: WorkspaceLeaf, private plugin: FinanceTrackerPlugin) {
    super(leaf);
  }

  override getViewType(): string    { return LEDGER_VIEW_TYPE; }
  override getDisplayText(): string { return 'Finance Ledger'; }
  override getIcon(): string        { return 'table'; }

  override async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.store.subscribe(() => this.renderList());
    this.buildShell();
  }

  override async onClose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  // ---------------------------------------------------------------------------
  // Shell — built once; filters live here; only the list container refreshes
  // ---------------------------------------------------------------------------

  private buildShell(): void {
    const { containerEl } = this;
    containerEl.empty();

    const wrap = containerEl.createEl('div', { cls: 'fl-wrap' });

    // ── Header ────────────────────────────────────────────────────────────────
    const header = wrap.createEl('div', { cls: 'fl-header' });
    header.createEl('h2', { text: 'Expense Ledger', cls: 'fl-title' });
    header.createEl('p', { text: 'All recorded expenses — filter by type or date range', cls: 'fl-subtitle' });

    // ── Filter bar ────────────────────────────────────────────────────────────
    const bar = wrap.createEl('div', { cls: 'fl-filter-bar' });

    // Type chips
    const chipGroup = bar.createEl('div', { cls: 'fl-chip-group' });
    const types: Array<{ value: Expense['type'] | ''; label: string }> = [
      { value: '',             label: 'All'          },
      { value: 'food',         label: '🍽 Food'       },
      { value: 'subscription', label: '📦 Sub'        },
      { value: 'transport',    label: '🚌 Transport'  },
      { value: 'utility',      label: '⚡ Utility'    },
      { value: 'misc',         label: '🗂 Misc'       },
    ];
    for (const { value, label } of types) {
      const chip = chipGroup.createEl('button', {
        text: label,
        cls: `fl-chip${this.filterType === value ? ' is-active' : ''}`,
      });
      chip.dataset['type'] = value;
      chip.addEventListener('click', () => {
        this.filterType = value;
        wrap.querySelectorAll('.fl-chip').forEach(c => c.removeClass('is-active'));
        chip.addClass('is-active');
        this.renderList();
      });
    }

    // Date range
    const dateGroup = bar.createEl('div', { cls: 'fl-date-group' });
    const fromInput = dateGroup.createEl('input', {
      cls: 'fl-date-input',
      attr: { type: 'date', 'aria-label': 'From date' },
    }) as HTMLInputElement;
    dateGroup.createEl('span', { text: '→', cls: 'fl-date-sep' });
    const toInput = dateGroup.createEl('input', {
      cls: 'fl-date-input',
      attr: { type: 'date', 'aria-label': 'To date' },
    }) as HTMLInputElement;

    fromInput.addEventListener('change', () => { this.filterFrom = fromInput.value; this.renderList(); });
    toInput.addEventListener('change',   () => { this.filterTo   = toInput.value;   this.renderList(); });

    // ── Summary strip (rendered dynamically) ─────────────────────────────────
    wrap.createEl('div', { cls: 'fl-summary', attr: { id: 'fl-summary' } });

    // ── List container ────────────────────────────────────────────────────────
    wrap.createEl('div', { attr: { id: 'fl-list-container' } });

    this.renderList();
  }

  // ---------------------------------------------------------------------------
  // List render — grouped by date (descending)
  // ---------------------------------------------------------------------------

  renderList(): void {
    const { containerEl } = this;
    const listContainer = containerEl.querySelector('#fl-list-container');
    const summaryEl     = containerEl.querySelector('#fl-summary');
    if (!listContainer || !summaryEl) return;

    listContainer.empty();
    summaryEl.empty();

    const currency = this.plugin.settings.currency;
    const all = this.plugin.store.getExpenses()
      .filter(e => {
        if (this.filterType && e.type !== this.filterType) return false;
        if (this.filterFrom && e.date < this.filterFrom)   return false;
        if (this.filterTo   && e.date > this.filterTo)     return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    // Summary strip
    const total = all.reduce((s, e) => s + e.amount, 0);
    summaryEl.createEl('span', { text: `${all.length} record${all.length !== 1 ? 's' : ''}`, cls: 'fl-summary-count' });
    summaryEl.createEl('span', { text: '·', cls: 'fl-summary-sep' });
    summaryEl.createEl('span', { text: `Total: ${formatAmount(total, currency)}`, cls: 'fl-summary-total' });

    if (all.length === 0) {
      const empty = listContainer.createEl('div', { cls: 'fl-empty' });
      empty.createEl('div', { text: '🗂', cls: 'fl-empty-icon' });
      empty.createEl('p', { text: 'No expenses match the current filters.', cls: 'fl-empty-text' });
      return;
    }

    // Group by date
    const groups = new Map<string, Expense[]>();
    for (const e of all) {
      let bucket = groups.get(e.date);
      if (!bucket) { bucket = []; groups.set(e.date, bucket); }
      bucket.push(e);
    }

    const list = listContainer.createEl('div', { cls: 'fl-list' });

    for (const [date, items] of groups) {
      // Section header
      list.createEl('div', {
        text: relativeDateLabel(date),
        cls: 'fl-date-section-header',
      });

      // Expense rows
      for (const e of items) {
        const row = list.createEl('div', { cls: 'fl-expense-row' });

        // Line 1: relative date label (left) + type badge (right)
        const line1 = row.createEl('div', { cls: 'fl-expense-line1' });
        line1.createEl('span', { text: relativeDateLabel(e.date), cls: 'fl-expense-date-label' });
        line1.createEl('span', {
          text: `${TYPE_ICONS[e.type]} ${e.type}`,
          cls: `fl-type-badge fl-type-badge--${e.type}`,
        });

        // Line 2: note (left) + amount (right)
        const line2 = row.createEl('div', { cls: 'fl-expense-line2' });
        line2.createEl('span', { text: e.note, cls: 'fl-expense-note' });
        line2.createEl('span', { text: formatAmount(e.amount, currency), cls: 'fl-expense-amount' });

        // Line 3: location (only if present)
        if (e.location) {
          const line3 = row.createEl('div', { cls: 'fl-expense-line3' });
          line3.createEl('span', { text: e.location, cls: 'fl-expense-location' });
        }
      }
    }
  }
}
