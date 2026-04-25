# Phase 3 — Plugin Core: Implementation Plan

## File to Create

```
src/main.ts
```

---

## Plugin Class Structure

```typescript
import { Plugin, PluginSettingTab, App, Setting, Notice } from 'obsidian';
import { DataStore } from './store/DataStore';
import { MarkdownSerializer } from './store/MarkdownSerializer';
import { FileWatcher } from './store/FileWatcher';
import { DEFAULT_SETTINGS, PluginSettings } from './types';

export default class FinanceTrackerPlugin extends Plugin {
  store: DataStore;
  settings: PluginSettings;
  private fileWatcher: FileWatcher;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private isWriting = false;

  async onload(): Promise<void> { ... }
  async onunload(): Promise<void> { ... }

  async loadSettings(): Promise<void> { ... }
  async saveSettings(): Promise<void> { ... }
  async loadLedger(): Promise<void> { ... }
  scheduleWrite(): void { ... }
  async flushToVault(): Promise<void> { ... }

  private registerRibbonButtons(): void { ... }
  private registerCommands(): void { ... }
  private registerViews(): void { ... }
}
```

---

## `onload()` sequence

```typescript
async onload(): Promise<void> {
  await this.loadSettings();
  this.store = new DataStore();
  await this.loadLedger();
  this.fileWatcher = new FileWatcher(
    this.app.vault,
    this.settings.ledgerPath,
    () => this.isWriting,
    () => this.handleExternalChange(),
  );
  this.registerRibbonButtons();
  this.registerCommands();
  this.addSettingTab(new FinanceTrackerSettingTab(this.app, this));
}
```

---

## `loadLedger()`

```typescript
async loadLedger(): Promise<void> {
  const file = this.app.vault.getFileByPath(this.settings.ledgerPath);
  if (!file) {
    // Create empty ledger file on first use
    await this.app.vault.create(this.settings.ledgerPath, MarkdownSerializer.empty());
    return;
  }
  try {
    const content = await this.app.vault.read(file);
    const { ledger, errors } = MarkdownSerializer.deserialize(content);
    if (errors.length > 0) {
      new Notice(`Ledger loaded with ${errors.length} parse error(s). Check console.`);
      errors.forEach(e => console.warn(`[Finance Tracker] Line ${e.line}: ${e.message}`));
    }
    this.store.load(ledger);
  } catch (err) {
    new Notice('Finance Tracker: failed to load ledger. Starting with empty store.');
    console.error('[Finance Tracker] loadLedger failed:', err);
  }
}
```

---

## `scheduleWrite()` + `flushToVault()`

```typescript
scheduleWrite(): void {
  if (this.saveTimer) clearTimeout(this.saveTimer);
  this.saveTimer = setTimeout(() => {
    this.saveTimer = null;
    this.flushToVault();
  }, 1500);
}

async flushToVault(): Promise<void> {
  this.isWriting = true;
  try {
    const content = MarkdownSerializer.serialize(this.store, {
      title: 'Finance Ledger',
      currency: this.settings.currency,
      updated: new Date().toISOString().slice(0, 10),
    });
    const file = this.app.vault.getFileByPath(this.settings.ledgerPath);
    if (file) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(this.settings.ledgerPath, content);
    }
  } finally {
    this.isWriting = false;
  }
}
```

---

## `onunload()`

```typescript
async onunload(): Promise<void> {
  if (this.saveTimer) {
    clearTimeout(this.saveTimer);
    await this.flushToVault();  // flush before plugin closes
  }
}
```

---

## Ribbon Buttons

```typescript
private registerRibbonButtons(): void {
  this.addRibbonIcon('wallet', 'Add Expense', () => {
    // Phase 4 will replace this with: new AddExpenseModal(this.app, this).open()
    new Notice('Add Expense — coming in Phase 4');
  });

  this.addRibbonIcon('trending-up', 'Add Income', () => {
    new Notice('Add Income — coming in Phase 4');
  });

  this.addRibbonIcon('credit-card', 'Add Debt', () => {
    new Notice('Add Debt — coming in Phase 4');
  });
}
```

Obsidian icon names come from Lucide Icons. Valid names for this project: `wallet`, `trending-up`, `credit-card`, `bar-chart-2`, `list`.

---

## Command Palette Registration

```typescript
private registerCommands(): void {
  this.addCommand({
    id: 'add-expense',
    name: 'Add Expense',
    callback: () => new Notice('Add Expense — coming in Phase 4'),
  });

  this.addCommand({
    id: 'add-income',
    name: 'Add Income',
    callback: () => new Notice('Add Income — coming in Phase 4'),
  });

  this.addCommand({
    id: 'add-debt',
    name: 'Add Debt',
    callback: () => new Notice('Add Debt — coming in Phase 4'),
  });
}
```

---

## Settings Tab

```typescript
class FinanceTrackerSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: FinanceTrackerPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Ledger file path')
      .setDesc('Path to your finance ledger markdown file inside the vault.')
      .addText(text => text
        .setPlaceholder('finance-ledger.md')
        .setValue(this.plugin.settings.ledgerPath)
        .onChange(async (value) => {
          this.plugin.settings.ledgerPath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Export directory')
      .addText(text => text
        .setPlaceholder('Finance/exports')
        .setValue(this.plugin.settings.exportDirectory)
        .onChange(async (value) => {
          this.plugin.settings.exportDirectory = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Default currency')
      .addText(text => text
        .setPlaceholder('XOF')
        .setValue(this.plugin.settings.currency)
        .onChange(async (value) => {
          this.plugin.settings.currency = value.toUpperCase().slice(0, 3);
          await this.plugin.saveSettings();
        }));
  }
}
```

---

## `manifest.json`

```json
{
  "id": "obsidian-finance-tracker",
  "name": "Finance Tracker",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "Track expenses, income, and debts in a local markdown ledger.",
  "author": "Taas S. Ekpaye",
  "authorUrl": "",
  "isDesktopOnly": false
}
```
