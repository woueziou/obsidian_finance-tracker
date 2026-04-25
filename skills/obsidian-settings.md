---
description: Plugin settings persistence with loadData/saveData, the spread-defaults pattern, and safe PluginSettingTab.display() conventions.
---

## API / Patterns

| Pattern | Correct usage |
|---|---|
| Load settings with defaults | `this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` or spread: `{ ...DEFAULT_SETTINGS, ...saved }` |
| Save settings | `await this.saveData(this.settings)` — persists to `.obsidian/plugins/<id>/data.json` |
| `loadData` return type | `loadData()` returns `Promise<unknown>` — cast to `Partial<YourSettings> \| null` before spreading |
| Settings tab display | Always call `containerEl.empty()` first — `display()` is invoked every time the panel opens |
| Text field binding | `.setValue(current).onChange(async (v) => { this.plugin.settings.field = v; await this.plugin.saveSettings(); })` |
| Validate before saving | Guard empty/invalid input in `onChange`; for bounded fields like currency use `.trim().length > 0` before assigning |

## Gotchas

- `loadData()` returns `null` on first install (no saved data yet) — always spread over defaults, never assume the object is complete.
- `display()` is called on every settings panel open, not just once — rebuilding without `containerEl.empty()` stacks duplicate UI elements.
- Saving on every `onChange` keystroke is fine for settings (low frequency) — unlike ledger writes, no debounce is required here.

## Avoid

- Assigning raw `loadData()` result directly to `this.settings` without merging defaults — new fields added in later versions will be `undefined`.
- Saving an empty string `""` for currency or ledger path — validate and fall back to the default value if the user clears the field.
- Storing secrets or API keys in `saveData` — the `data.json` file is plain text in the vault.
