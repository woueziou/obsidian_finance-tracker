// src/main.ts
// Plugin entry point. Orchestrates DataStore, MarkdownSerializer, FileWatcher,
// ribbon buttons, command palette, and settings tab.

import { Plugin, PluginSettingTab, App, Setting, Notice } from 'obsidian';
import { DataStore } from './store/DataStore';
import { MarkdownSerializer } from './store/MarkdownSerializer';
import { FileWatcher } from './store/FileWatcher';
import { DEFAULT_SETTINGS } from './types';
import type { PluginSettings } from './types';

export default class FinanceTrackerPlugin extends Plugin {
  store!: DataStore;
  settings!: PluginSettings;
  private fileWatcher!: FileWatcher;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private isWriting = false;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  override async onload(): Promise<void> {
    await this.loadSettings();
    this.store = new DataStore();
    await this.loadLedger();
    this.fileWatcher = new FileWatcher(
      this.app.vault,
      this.settings.ledgerPath,
      () => this.isWriting,
      () => { void this.handleExternalChange(); },
    );
    // registerEvent ensures Obsidian unregisters the vault listener on plugin unload
    this.registerEvent(this.fileWatcher.eventRef);
    this.registerRibbonButtons();
    this.registerCommands();
    this.addSettingTab(new FinanceTrackerSettingTab(this.app, this));
  }

  override async onunload(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      try {
        await this.flushToVault(); // flush before plugin closes
      } catch (err) {
        console.error('[Finance Tracker] onunload flush failed:', err);
      }
    }
    this.fileWatcher?.destroy(); // clears pending debounce timer
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async loadSettings(): Promise<void> {
    const saved = await this.loadData() as Partial<PluginSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ---------------------------------------------------------------------------
  // Ledger I/O
  // ---------------------------------------------------------------------------

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

  scheduleWrite(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flushToVault();
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

  // ---------------------------------------------------------------------------
  // External change handler
  // ---------------------------------------------------------------------------

  private async handleExternalChange(): Promise<void> {
    // Re-read the ledger file and reload the store when an external edit is detected
    const file = this.app.vault.getFileByPath(this.settings.ledgerPath);
    if (!file) return;
    try {
      const content = await this.app.vault.read(file);
      const { ledger, errors } = MarkdownSerializer.deserialize(content);
      if (errors.length > 0) {
        errors.forEach(e => console.warn(`[Finance Tracker] Line ${e.line}: ${e.message}`));
      }
      this.store.load(ledger);
    } catch (err) {
      console.error('[Finance Tracker] handleExternalChange failed:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Ribbon buttons
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Command palette
  // ---------------------------------------------------------------------------

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
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

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
          const trimmed = value.toUpperCase().slice(0, 3);
          if (trimmed.length > 0) {
            this.plugin.settings.currency = trimmed;
            await this.plugin.saveSettings();
          }
        }));
  }
}
