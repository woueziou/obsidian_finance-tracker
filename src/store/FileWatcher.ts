// src/store/FileWatcher.ts
// Watches the ledger file for external changes and debounces the callback.
// Uses the Obsidian Vault event API — not testable in isolation without a mock.

import type { Vault, TAbstractFile } from 'obsidian';

export class FileWatcher {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private vault: Vault,
    private ledgerPath: string,
    private isWriting: () => boolean,
    private onExternalChange: () => void,
  ) {
    this.vault.on('modify', (file: TAbstractFile) => {
      if (file.path !== this.ledgerPath) return;
      if (this.isWriting()) return; // plugin's own write — ignore
      if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(this.onExternalChange, 500);
    });
  }

  /** Call this when the plugin unloads to prevent timer leaks. */
  destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}