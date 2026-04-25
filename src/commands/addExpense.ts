// src/commands/addExpense.ts
// Modal form for adding a new expense record.

import { App, Modal, Setting, Notice } from 'obsidian';
import { ExpenseInputSchema } from '../schemas';
import type { ExpenseType } from '../types';
import type FinanceTrackerPlugin from '../main';

export class AddExpenseModal extends Modal {
  private formData: {
    date?: string;
    amount?: number;
    type?: ExpenseType;
    note?: string;
    location?: string;
  } = {};

  private errorEl!: HTMLElement;

  constructor(app: App, private plugin: FinanceTrackerPlugin) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Add Expense' });
    this.buildForm(contentEl);
    this.scope.register([], 'Enter', () => { this.handleSubmit(); return false; });
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private buildForm(contentEl: HTMLElement): void {
    // Date field — defaults to today
    new Setting(contentEl)
      .setName('Date')
      .setDesc('YYYY-MM-DD')
      .addText(text => {
        const today = new Date().toISOString().slice(0, 10);
        this.formData.date = today;
        text
          .setValue(today)
          .onChange(v => { this.formData.date = v.trim(); });
      });

    // Amount field
    new Setting(contentEl)
      .setName('Amount')
      .setDesc(`Enter whole number in ${this.plugin.settings.currency}`)
      .addText(text => {
        text
          .setPlaceholder('15000')
          .onChange(v => {
            const parsed = parseInt(v.replace(/\s/g, ''), 10);
            this.formData.amount = isNaN(parsed) ? undefined : parsed * 100;
          });
      });

    // Type dropdown
    new Setting(contentEl)
      .setName('Type')
      .addDropdown(drop => {
        drop
          .addOptions({
            food: 'Food',
            subscription: 'Subscription',
            misc: 'Misc',
            utility: 'Utility',
            transport: 'Transport',
          })
          .setValue('food')
          .onChange(v => { this.formData.type = v as ExpenseType; });
        this.formData.type = 'food';
      });

    // Note field
    new Setting(contentEl)
      .setName('Note')
      .addText(text => text.onChange(v => { this.formData.note = v.trim(); }));

    // Location field (optional)
    new Setting(contentEl)
      .setName('Location')
      .setDesc('Optional')
      .addText(text => text.onChange(v => { this.formData.location = v.trim() || undefined; }));

    // Error display
    this.errorEl = contentEl.createEl('p', { cls: 'finance-tracker-error', text: '' });

    // Submit button
    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('Add Expense')
        .setCta()
        .onClick(() => { this.handleSubmit(); }));
  }

  private handleSubmit(): void {
    this.errorEl.setText('');

    const payload = { ...this.formData, currency: this.plugin.settings.currency };
    const result = ExpenseInputSchema.safeParse(payload);

    if (!result.success) {
      const messages = result.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('\n');
      this.errorEl.setText(messages);
      return;
    }

    this.plugin.store.addExpense(result.data);
    this.plugin.scheduleWrite();
    new Notice('Expense added!');
    this.close();
  }
}
