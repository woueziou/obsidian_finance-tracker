# Phase 3 — Plugin Core: Context

## Why This Phase Exists

Phases 1 and 2 built the data layer in pure TypeScript with no Obsidian coupling. Phase 3 is where the plugin actually becomes an Obsidian plugin — it wires the data layer to the Obsidian API and makes it loadable in a vault.

After this phase, the plugin:
- Loads and unloads without errors
- Reads the ledger file and populates the DataStore on startup
- Shows ribbon buttons for adding records
- Persists user settings across restarts

## What This Phase Covers

- `src/main.ts` — the `Plugin` subclass; entry point for everything
- Settings interface (already defined in `types.ts`), settings tab UI in main
- Ribbon button registration
- Command palette registration
- Lifecycle: `onload()` and `onunload()`
- Debounced file writes

## What This Phase Does NOT Cover

- Modal implementations (Phase 4) — buttons will open placeholder alerts
- Dashboard view (Phase 5)
- Export commands (Phase 6)

## Inputs

- Phase 1: `src/types.ts` (PluginSettings, DEFAULT_SETTINGS)
- Phase 2: `src/store/DataStore.ts`, `src/store/MarkdownSerializer.ts`, `src/store/FileWatcher.ts`
- Obsidian API: `Plugin`, `PluginSettingTab`, `Setting`, `Notice`, `addRibbonIcon`

## Outputs

- `src/main.ts` — fully functional plugin entry point
- Plugin loads in a dev vault, buttons are visible, settings tab opens
- Ledger file is created if absent; loaded if present

## Risk

Low-medium. The main risk is unhandled async errors in `onload()` — if the vault read fails, the plugin should log and continue with an empty DataStore, not crash Obsidian.
