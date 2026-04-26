// src/store/FileWatcher.ts
// Watches the ledger file for external changes and debounces the callback.
// Uses the Obsidian Vault event API — not testable in isolation without a mock.

import type { Vault, TAbstractFile, EventRef } from 'obsidian';

export class FileWatcher {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Exposed so the plugin can pass it to this.registerEvent() for proper cleanup. */
  readonly eventRef: EventRef;

  constructor(
    private vault: Vault,
    private ledgerPath: string,
    private isWriting: () => boolean,
    private onExternalChange: () => void,
  ) {
    this.eventRef = this.vault.on('modify', (file: TAbstractFile) => {
      if (file.path !== this.ledgerPath) return;
      if (this.isWriting()) return; // plugin's own write — ignore
      if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(this.onExternalChange, 500);
    });
  }

  /** Clears any pending debounce timer. Event cleanup is handled by the plugin via registerEvent(). */
  destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}