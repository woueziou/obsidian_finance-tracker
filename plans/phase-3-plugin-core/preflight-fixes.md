# Phase 3 Pre-Flight Fixes

Applied before menelik starts Phase 3. All three issues flagged by sokrates are resolved.

---

## Fix 1 — `MarkdownSerializer.empty()` was missing

**File:** `src/store/MarkdownSerializer.ts`

`loadLedger()` calls `MarkdownSerializer.empty()` to seed the vault file on first use, but the method didn't exist.

**Applied:** Added `empty(): string` to the `MarkdownSerializer` object. Returns a canonical ledger skeleton with today's date in frontmatter and empty `## Expenses`, `## Income`, `## Debts` sections.

---

## Fix 2 — `FileWatcher` vault event listener was never unregistered (resource leak)

**File:** `src/store/FileWatcher.ts`

`vault.on('modify', ...)` returns an `EventRef`. The Obsidian pattern for safe cleanup is to pass that ref to `this.registerEvent()` at the plugin level — Obsidian then unregisters it automatically when the plugin unloads. The original code discarded the `EventRef`, leaving the listener permanently registered after plugin unload.

**Applied:** Stored the return value of `vault.on(...)` as `readonly eventRef: EventRef` on `FileWatcher`. The plugin's `onload()` now calls `this.registerEvent(this.fileWatcher.eventRef)` immediately after constructing the watcher (see implementation plan update below). `destroy()` comment updated to clarify it only handles the debounce timer; event cleanup is delegated to Obsidian via `registerEvent`.

---

## Fix 3 — `onunload()` and `handleExternalChange()` were incomplete in the plan

**File:** `plans/phase-3-plugin-core/implementation.md`

`onunload()` did not call `fileWatcher.destroy()`, leaving a possible pending debounce timer on unload. `handleExternalChange()` was referenced in `onload()` but never defined anywhere in the plan.

**Applied:**
- Added `this.fileWatcher.destroy()` to `onunload()`.
- Added `this.registerEvent(this.fileWatcher.eventRef)` to `onload()` after watcher construction.
- Defined `handleExternalChange()`: reads the vault file, calls `MarkdownSerializer.deserialize()`, then `store.load()`. Mirrors `loadLedger()` but skips the file-creation branch (file must already exist if a modify event fired).

---

## TypeScript check

```
npx tsc --noEmit --strict  →  (no output, exit 0)
```

All fixes are type-safe. Phase 3 is now CLEAR TO IMPLEMENT.
