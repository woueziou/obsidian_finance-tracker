// src/commands/addIncome.ts
// Modal form for adding a new income record.

import { App, Modal, Setting, Notice } from 'obsidian';
import { IncomeInputSchema } from '../schemas';
import type { IncomeType } from '../types';
import type FinanceTrackerPlugin from '../main';

export class AddIncomeModal extends Modal {
  private formData: {
    date?: string;
    amount?: number;
    type?: IncomeType;
    note?: string;
    source?: string;
  } = {};

  private errorEl!: HTMLElement;

  constructor(app: App, private plugin: FinanceTrackerPlugin) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Add Income' });
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
          .setPlaceholder('150000')
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
            salary: 'Salary',
            donation: 'Donation',
            loan: 'Loan',
            investment: 'Investment',
            other: 'Other',
          })
          .setValue('salary')
          .onChange(v => { this.formData.type = v as IncomeType; });
        this.formData.type = 'salary';
      });

    // Source field (required)
    new Setting(contentEl)
      .setName('Source')
      .addText(text => text
        .setPlaceholder('e.g. April freelance work')
        .onChange(v => { this.formData.source = v.trim(); }));

    // Note field (required)
    new Setting(contentEl)
      .setName('Note')
      .addText(text => text.onChange(v => { this.formData.note = v.trim(); }));

    // Error display
    this.errorEl = contentEl.createEl('p', { cls: 'finance-tracker-error', text: '' });

    // Submit button
    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('Add Income')
        .setCta()
        .onClick(() => { this.handleSubmit(); }));
  }

  private handleSubmit(): void {
    this.errorEl.setText('');

    const payload = { ...this.formData, currency: this.plugin.settings.currency };
    const result = IncomeInputSchema.safeParse(payload);

    if (!result.success) {
      const messages = result.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('\n');
      this.errorEl.setText(messages);
      return;
    }

    this.plugin.store.addIncome(result.data);
    this.plugin.scheduleWrite();
    new Notice('Income added!');
    this.close();
  }
}
