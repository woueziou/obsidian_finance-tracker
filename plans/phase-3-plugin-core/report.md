# Phase 3 — Plugin Core: Report

## What Was Built

### Files Created
- `src/main.ts` — full plugin entry point: `FinanceTrackerPlugin` class + `FinanceTrackerSettingTab` class
- `manifest.json` — Obsidian plugin manifest

### Files Modified
- `plans/phase-3-plugin-core/validation.md` — checked off build-verifiable items

## Decisions Made

### `override` keyword on `onload` / `onunload`
The project's `tsconfig.json` has `noImplicitOverride` enabled (implied by strict mode + the obsidian type declarations). TypeScript raised TS4114 errors for `onload` and `onunload`. Added `override` keyword to both methods. Not mentioned in the plan but required for a clean compile.

### `type-only` import for `PluginSettings`
`verbatimModuleSyntax` is enabled in `tsconfig.json`. `PluginSettings` is used only as a type, so it must be imported with `import type`. Split the import from `./types` into a value import (`DEFAULT_SETTINGS`) and a type import (`PluginSettings`).

### `void` wrapper on async callbacks passed to `FileWatcher`
The `FileWatcher` constructor expects `onExternalChange: () => void`. `handleExternalChange` is async, so calling it directly would return a `Promise<void>` instead of `void`. Wrapped with `() => { void this.handleExternalChange(); }` to satisfy the type without swallowing the error (the inner method has its own try/catch).

### `!` non-null assertions on class fields
`store`, `settings`, `fileWatcher` are assigned in `onload()` rather than in the constructor. Marked with `!` (definite assignment assertion) to avoid TS strictPropertyInitialization errors. This is standard Obsidian plugin practice.

## Known Issues / Deferred Items

- `npm run build` / esbuild output (`main.js`) has not been verified — no build script was configured in this phase. That is out of scope for Phase 3 per the plan.
- All ribbon buttons and commands show placeholder Notices. Real modals arrive in Phase 4.
- `registerViews()` is not implemented — no views exist yet. It was listed in the class skeleton in the plan but was not included in any implementation step. Deferred to Phase 5.

## Context for Next Phase (Phase 4 — UI Modals)

- `FinanceTrackerPlugin` is the default export from `src/main.ts`.
- `plugin.store` is a `DataStore` instance, publicly accessible — modals can call `plugin.store.addExpense(...)` etc.
- `plugin.scheduleWrite()` must be called after any store mutation from a modal so changes are flushed to the vault.
- `plugin.settings.currency` holds the active currency string.
- To open a modal, Phase 4 should: `import FinanceTrackerPlugin from '../main'` and replace the `new Notice(...)` callbacks in `registerRibbonButtons()` and `registerCommands()` with `new AddExpenseModal(this.app, this).open()`.
- `FinanceTrackerSettingTab` lives at the bottom of `src/main.ts` — it is not exported. Phase 4 does not need to import it.
