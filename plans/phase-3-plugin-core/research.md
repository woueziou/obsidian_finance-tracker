# Phase 3 — Plugin Core: Research

## Obsidian Plugin Lifecycle

```typescript
class MyPlugin extends Plugin {
  async onload(): Promise<void>   // called when plugin is enabled
  async onunload(): Promise<void> // called when plugin is disabled or Obsidian closes
}
```

`onload` is async — Obsidian awaits it. If it throws, the plugin is marked as failed. Wrap the entire body in try/catch to prevent this.

---

## Obsidian Settings API

### Persistence
```typescript
// In Plugin class:
await this.loadData()   // returns saved JSON or null
await this.saveData(obj) // saves obj as JSON
```

Typical pattern:
```typescript
async loadSettings(): Promise<void> {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings(): Promise<void> {
  await this.saveData(this.settings);
}
```

`Object.assign({}, DEFAULT_SETTINGS, saved)` ensures any new settings keys added in future versions get their default values even if they're absent from the saved JSON.

---

## Ribbon Icons

`this.addRibbonIcon(iconId, tooltip, callback)` adds a button to the left sidebar.

`iconId` must be a valid Lucide icon name. The plugin is responsible for verifying the name is valid in the Obsidian version being targeted.

Relevant icons for this plugin:
| Icon name | Visual | Use |
|---|---|---|
| `wallet` | 💰 | Add Expense |
| `trending-up` | 📈 | Add Income |
| `credit-card` | 💳 | Add Debt |
| `bar-chart-2` | 📊 | Open Dashboard |
| `list` | 📋 | Open Ledger View |

---

## Command Registration

```typescript
this.addCommand({
  id: 'my-command',      // kebab-case, unique within plugin
  name: 'My Command',    // shown in command palette as "Plugin Name: My Command"
  callback: () => { ... },
  // Optional:
  hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'e' }],
  // Or for editor-only commands:
  editorCallback: (editor, view) => { ... },
});
```

Commands registered via `this.addCommand` are automatically cleaned up on `onunload`.

---

## Notice API

```typescript
new Notice('message')          // brief, auto-dismiss (~4s)
new Notice('message', 8000)    // stays for 8 seconds
new Notice('Error: ...', 5000) // for errors
```

Notices appear as toast notifications in the top-right corner of Obsidian.

---

## Vault File API

```typescript
// Get a file handle (returns null if file doesn't exist)
const file: TFile | null = this.app.vault.getFileByPath('path/to/file.md');

// Read file content
const content: string = await this.app.vault.read(file);

// Modify existing file
await this.app.vault.modify(file, newContent);

// Create new file
await this.app.vault.create('path/to/file.md', initialContent);

// Listen for changes
this.app.vault.on('modify', (file: TAbstractFile) => { ... });
// Note: register via this.registerEvent() so it's cleaned up on unload:
this.registerEvent(this.app.vault.on('modify', handler));
```

---

## Handling First Run (Ledger Doesn't Exist)

On first plugin load, `finance-ledger.md` won't exist. The plugin should create it with an empty canonical structure:

```typescript
static empty(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `---\ntitle: Finance Ledger\ncurrency: XOF\nupdated: ${today}\n---\n\n## Expenses\n\n## Income\n\n## Debts\n`;
}
```

This prevents the user from seeing an error on first load and gives them a valid starting file they can understand.

---

## esbuild Config

The sample plugin `esbuild.config.mjs` handles:
- TypeScript compilation
- Bundling into `main.js`
- Source maps in dev mode
- `external: ['obsidian']` — Obsidian API is provided at runtime, not bundled

No changes needed to the build config for Phase 3.

---

## Plugin ID in manifest.json

The `id` in `manifest.json` must:
- Be globally unique across all community plugins
- Use only lowercase letters, numbers, hyphens
- Match the folder name in `.obsidian/plugins/<id>/`

For personal use, uniqueness only matters within your own vault.
