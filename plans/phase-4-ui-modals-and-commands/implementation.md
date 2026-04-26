# Phase 4 — UI Modals & Commands: Implementation Plan

## Pattern: Modal Base Class

All three modals share the same pattern. Build `AddExpenseModal` first, then replicate for income and debt.

```typescript
import { App, Modal, Setting, Notice } from 'obsidian';
import { ExpenseInputSchema } from '../schemas';
import type FinanceTrackerPlugin from '../main';

export class AddExpenseModal extends Modal {
  private formData: Partial<ExpenseInput> = {};
  private errorEl: HTMLElement;

  constructor(app: App, private plugin: FinanceTrackerPlugin) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Add Expense' });
    this.buildForm(contentEl);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
```

---

## `AddExpenseModal` — Form Fields

Each field uses Obsidian's `Setting` API:

### Date field (defaults to today)
```typescript
new Setting(contentEl)
  .setName('Date')
  .setDesc('YYYY-MM-DD')
  .addText(text => {
    text
      .setValue(new Date().toISOString().slice(0, 10))
      .onChange(v => { this.formData.date = v.trim(); });
  });
```

### Amount field
```typescript
new Setting(contentEl)
  .setName('Amount')
  .setDesc('Enter whole number (e.g. 15000 for 15,000 XOF)')
  .addText(text => {
    text
      .setPlaceholder('15000')
      .onChange(v => {
        const n = parseInt(v, 10);
        this.formData.amount = isNaN(n) ? undefined : n * 100;
      });
  });
```

### Type dropdown
```typescript
new Setting(contentEl)
  .setName('Type')
  .addDropdown(drop => {
    drop
      .addOptions({ food: 'Food', subscription: 'Subscription', misc: 'Misc', utility: 'Utility', transport: 'Transport' })
      .onChange(v => { this.formData.type = v as ExpenseType; });
  });
```

### Note field
```typescript
new Setting(contentEl)
  .setName('Note')
  .addText(text => text.onChange(v => { this.formData.note = v.trim(); }));
```

### Location field (optional)
```typescript
new Setting(contentEl)
  .setName('Location')
  .setDesc('Optional')
  .addText(text => text.onChange(v => { this.formData.location = v.trim() || undefined; }));
```

### Error display + Submit button
```typescript
this.errorEl = contentEl.createEl('p', { cls: 'finance-tracker-error', text: '' });

new Setting(contentEl)
  .addButton(btn => btn
    .setButtonText('Add Expense')
    .setCta()
    .onClick(() => this.handleSubmit()));

// Register Enter key to trigger submit (do this in onOpen after buildForm)
this.scope.register([], 'Enter', () => { this.handleSubmit(); return false; });
```

---

## `handleSubmit()`

```typescript
private handleSubmit(): void {
  this.errorEl.textContent = '';

  // Inject currency from settings — required by schema but not collected in the form
  const payload = { ...this.formData, currency: this.plugin.settings.currency };

  const result = ExpenseInputSchema.safeParse(payload);
  if (!result.success) {
    const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    this.errorEl.textContent = messages;
    return;
  }

  this.plugin.store.addExpense(result.data);
  // Note: same currency-inject pattern applies to AddIncomeModal and AddDebtModal handleSubmit()
  this.plugin.scheduleWrite();
  new Notice('Expense added!');
  this.close();
}
```

`safeParse` never throws — errors are surfaced in the form, not via an exception.

---

## `AddIncomeModal` — Field Differences

Same structure as expense modal, with these differences:

| Field | Type |
|---|---|
| `type` | `IncomeType` dropdown: salary, donation, loan, investment, other |
| `source` | Text field (replaces `location`) — required |
| `note` | Text field — required |

No `location` field.

---

## `AddDebtModal` — Field Differences

| Field | Notes |
|---|---|
| `amount` | Same parsing as expense |
| `dueDate` | Date text field, no default |
| `person` | Text, required |
| `note` | Text, required |
| `status` | Dropdown: open, partial, paid — defaults to `open` |
| `interestRate` | Number field, optional — parse as `parseFloat` |

---

## `src/commands/index.ts`

```typescript
import { App } from 'obsidian';
import type FinanceTrackerPlugin from '../main';
import { AddExpenseModal } from './addExpense';
import { AddIncomeModal }  from './addIncome';
import { AddDebtModal }    from './addDebt';

export function registerCommands(plugin: FinanceTrackerPlugin): void {
  plugin.addCommand({
    id: 'add-expense',
    name: 'Add Expense',
    callback: () => new AddExpenseModal(plugin.app, plugin).open(),
  });

  plugin.addCommand({
    id: 'add-income',
    name: 'Add Income',
    callback: () => new AddIncomeModal(plugin.app, plugin).open(),
  });

  plugin.addCommand({
    id: 'add-debt',
    name: 'Add Debt',
    callback: () => new AddDebtModal(plugin.app, plugin).open(),
  });
}
```

Call `registerCommands(this)` from `main.ts` `onload()`, replacing the Phase 3 stubs.

**Editing `main.ts`:** Remove the existing private `registerCommands()` method entirely and replace the call site in `onload()` with `registerCommands(this)` (imported from `./commands/index`). Also update `registerRibbonButtons()` to open the real modals instead of showing a Notice stub:

```typescript
private registerRibbonButtons(): void {
  this.addRibbonIcon('wallet', 'Add Expense', () => new AddExpenseModal(this.app, this).open());
  this.addRibbonIcon('trending-up', 'Add Income', () => new AddIncomeModal(this.app, this).open());
  this.addRibbonIcon('credit-card', 'Add Debt', () => new AddDebtModal(this.app, this).open());
}
```

Add these imports to `main.ts`:
```typescript
import { registerCommands } from './commands/index';
import { AddExpenseModal } from './commands/addExpense';
import { AddIncomeModal }  from './commands/addIncome';
import { AddDebtModal }    from './commands/addDebt';
```

---

## Currency in Form

The amount field caption should show the user's configured currency:

```typescript
.setDesc(`Enter whole number in ${this.plugin.settings.currency}`)
```

---

## CSS

Add a `styles.css` file with:

```css
.finance-tracker-error {
  color: var(--color-red);
  font-size: 0.875em;
  margin: 4px 0 8px;
  min-height: 1.25em;
}
```

Obsidian loads `styles.css` automatically when it sits next to `main.js` in the plugin folder — no `manifest.json` entry is needed.
