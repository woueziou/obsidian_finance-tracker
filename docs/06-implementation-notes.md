# Implementation Notes

## Parser State Machine

The markdown file is parsed in a single top-to-bottom pass. The parser tracks two pieces of state:

- `currentSection: 'expenses' | 'income' | 'debts' | null`
- `currentDate: string | null` (ISO 8601, set by `### YYYY-MM-DD` headings)

```
for each line:
  if line matches /^## Expenses/i  → set section = 'expenses', clear currentDate
  if line matches /^## Income/i    → set section = 'income', clear currentDate
  if line matches /^## Debts/i     → set section = 'debts'
  if line matches /^### (\d{4}-\d{2}-\d{2})/ and section ∈ {expenses, income}
                                   → set currentDate = match[1]
  if line matches /^- / and section = 'expenses'
                                   → parse as expense (requires currentDate set)
  if line matches /^- / and section = 'income'
                                   → parse as income (requires currentDate set)
  if line matches /^- / and section = 'debts'
                                   → parse as debt
  else → skip
```

Key edge: if a `- ` list line appears in the expenses section before any `### date` heading, emit a `ParseError` for each such line (date unknown).

---

## Amount Parsing

Expense/income lines contain `15000 XOF` — parse as:
- `amount = parseInt('15000', 10) * 100`  → stored as cents
- `currency = 'XOF'`

On serialization:
- `amount_cents / 100` gives back `15000` (integer division is fine for XOF which has no subunit)
- Write as `15000 XOF` — never write the cents value to markdown

---

## Debounced Writes

Use a module-level timer reference in `main.ts`:

```typescript
private saveTimer: ReturnType<typeof setTimeout> | null = null;

scheduleWrite(): void {
  if (this.saveTimer) clearTimeout(this.saveTimer);
  this.saveTimer = setTimeout(() => {
    this.saveTimer = null;
    this.flushToVault();
  }, 1500);
}

async flushToVault(): Promise<void> {
  const content = MarkdownSerializer.serialize(this.store, this.settings);
  const file = this.app.vault.getFileByPath(this.settings.ledgerPath);
  if (file) {
    await this.app.vault.modify(file, content);
  } else {
    await this.app.vault.create(this.settings.ledgerPath, content);
  }
}
```

In `onunload()`, flush immediately without the timer (user is closing the app).

---

## Chart.js Lazy Loading

Do not add Chart.js to `package.json`. Load it from CDN only when `DashboardView.onOpen()` is called:

```typescript
async loadChartJs(): Promise<void> {
  if (window.Chart) return; // already loaded
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Chart.js failed to load'));
    document.head.appendChild(script);
  });
}
```

Destroy chart instances on `onClose()` to avoid canvas reuse errors:

```typescript
onClose(): void {
  this.chartInstances.forEach(c => c.destroy());
  this.chartInstances = [];
  this.unsubscribe?.();
}
```

---

## FileWatcher — Avoiding Re-entrant Writes

When the plugin writes to the ledger file, Obsidian fires the `vault.on('modify')` event. The FileWatcher must not trigger a reload in response to the plugin's own writes.

Solution: track a `isWriting` flag in the main plugin class. Set it to `true` before `vault.modify()`, clear it after. The FileWatcher checks this flag before prompting the user.

---

## CSV Special Characters

CSV escaping rules:
1. If a field contains `,`, `"`, or `\n`, wrap the entire field in `"`
2. Inside a double-quoted field, escape `"` as `""`

```typescript
function csvField(value: string): string {
  if (/[,"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

---

## SQL Escaping

For SQL exporters, escape single quotes by doubling them:

```typescript
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
```

Do not use template strings to build SQL with user data directly — always pass through `sqlString()`.

---

## Subscription Cleanup Pattern

Every view that subscribes to DataStore must clean up. Enforce this pattern:

```typescript
class DashboardView extends ItemView {
  private unsubscribe: (() => void) | null = null;

  async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.store.subscribe(() => this.render());
    await this.render();
  }

  async onClose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
```

---

## XOF Currency Formatting

XOF has 0 decimal places and uses a space as thousands separator in French locale:

```typescript
function formatXOF(cents: number): string {
  const amount = cents / 100;
  // Obsidian runs in a browser context — Intl is available
  return new Intl.NumberFormat('fr-TG', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
  // Output: "15 000 XOF"
}
```

---

## ID Strategy on Re-parse

Markdown does not store IDs. Each full re-parse assigns new UUIDs. This creates a problem for import deduplication.

For export files (CSV/JSON/SQL), IDs are included. Import deduplication is by ID.

For re-parse from markdown (e.g., after external edit), there is no deduplication — the DataStore is fully replaced. This is intentional: markdown is the source of truth, not the IDs.

---

## Large Ledger Performance

For ledgers with 10,000+ lines:
- Parse is fast (single pass, ~O(n))
- DataStore queries that filter by date are O(n) — acceptable for personal use
- If performance degrades, add a `Map<string, Expense[]>` keyed by date as secondary index
- Do not implement pagination in MVP — implement only if user reports slowness

---

## Obsidian Plugin Registration Pattern

```typescript
export default class FinanceTrackerPlugin extends Plugin {
  store: DataStore;
  settings: PluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.store = new DataStore();
    await this.loadLedger();

    this.registerCommands();
    this.registerViews();
    this.registerRibbonButtons();
    this.addSettingTab(new FinanceTrackerSettingTab(this.app, this));
  }

  async onunload(): Promise<void> {
    // flush pending writes synchronously-ish
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      await this.flushToVault();
    }
  }
}
```
