// src/commands/addDebt.ts
// Modal form for adding a new debt record.

import { App, Modal, Setting, Notice } from 'obsidian';
import { DebtInputSchema } from '../schemas';
import type { DebtStatus } from '../types';
import type FinanceTrackerPlugin from '../main';

export class AddDebtModal extends Modal {
  private formData: {
    amount?: number;
    dueDate?: string;
    person?: string;
    note?: string;
    status?: DebtStatus;
    interestRate?: number;
  } = {
    status: 'open',
  };

  private errorEl!: HTMLElement;

  constructor(app: App, private plugin: FinanceTrackerPlugin) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Add Debt' });
    this.buildForm(contentEl);
    this.scope.register([], 'Enter', () => { this.handleSubmit(); return false; });
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private buildForm(contentEl: HTMLElement): void {
    // Amount field
    new Setting(contentEl)
      .setName('Amount')
      .setDesc(`Enter whole number in ${this.plugin.settings.currency}`)
      .addText(text => {
        text
          .setPlaceholder('100000')
          .onChange(v => {
            const parsed = parseInt(v.replace(/\s/g, ''), 10);
            this.formData.amount = isNaN(parsed) ? undefined : parsed * 100;
          });
      });

    // Due date field (no default)
    new Setting(contentEl)
      .setName('Due Date')
      .setDesc('YYYY-MM-DD')
      .addText(text => {
        text
          .setPlaceholder('2026-06-01')
          .onChange(v => { this.formData.dueDate = v.trim() || undefined; });
      });

    // Person field (required)
    new Setting(contentEl)
      .setName('Person')
      .addText(text => text
        .setPlaceholder('e.g. Kofi')
        .onChange(v => { this.formData.person = v.trim(); }));

    // Note field (required)
    new Setting(contentEl)
      .setName('Note')
      .addText(text => text.onChange(v => { this.formData.note = v.trim(); }));

    // Status dropdown — defaults to open
    new Setting(contentEl)
      .setName('Status')
      .addDropdown(drop => {
        drop
          .addOptions({
            open: 'Open',
            partial: 'Partial',
            paid: 'Paid',
          })
          .setValue('open')
          .onChange(v => { this.formData.status = v as DebtStatus; });
      });

    // Interest rate field (optional, decimal)
    new Setting(contentEl)
      .setName('Interest Rate')
      .setDesc('Optional — percentage (e.g. 5.0)')
      .addText(text => {
        text
          .setPlaceholder('5.0')
          .onChange(v => {
            const trimmed = v.trim();
            if (trimmed === '') {
              this.formData.interestRate = undefined;
            } else {
              const parsed = parseFloat(trimmed);
              this.formData.interestRate = isNaN(parsed) ? undefined : parsed;
            }
          });
      });

    // Error display
    this.errorEl = contentEl.createEl('p', { cls: 'finance-tracker-error', text: '' });

    // Submit button
    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('Add Debt')
        .setCta()
        .onClick(() => { this.handleSubmit(); }));
  }

  private handleSubmit(): void {
    this.errorEl.setText('');

    const payload = { ...this.formData, currency: this.plugin.settings.currency };
    const result = DebtInputSchema.safeParse(payload);

    if (!result.success) {
      const messages = result.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('\n');
      this.errorEl.setText(messages);
      return;
    }

    this.plugin.store.addDebt(result.data);
    this.plugin.scheduleWrite();
    new Notice('Debt added!');
    this.close();
  }
}
