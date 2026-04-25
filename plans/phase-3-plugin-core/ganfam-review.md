# Phase 3 — Plugin Core: ganfam Review

## Verdict

PASS WITH WARNINGS

---

## Bugs Found

| Severity | File | Line | Issue | Fix |
|---|---|---|---|---|
| Medium | `src/main.ts` | 45 (pre-fix) | `this.fileWatcher.destroy()` throws if `onload` threw before `fileWatcher` was assigned — non-null assertion `!` on the field means runtime crash | Change to `this.fileWatcher?.destroy()` — **applied** |
| Low | `src/main.ts` | 43 (pre-fix) | `await this.flushToVault()` in `onunload` has no try/catch — unhandled rejection on vault error silently kills unload | Wrap in try/catch with `console.error` — **applied** |
| Low | `src/store/MarkdownSerializer.ts` | `serializeIncomeLine` | `note` field is never written to the serialized line — carry-over from Phase 2; round-trips will silently drop income notes | Add `note` to the income line template in Phase 2 fix-up or Phase 4 |
| Low | `src/main.ts` | `onChange` for currency | `value.toUpperCase().slice(0, 3)` still saves an empty string `""` if user clears the field | Guard: `if (value.trim().length > 0)` before saving, else revert to default |

---

## Plan Gaps

- `registerViews()` is absent from `onload` — deferred to Phase 5, acknowledged in `plans/phase-3-plugin-core/report.md`. Not a blocking gap.

---

## TypeScript Issues

- `tsc --noEmit --strict` exits clean (zero errors) after the two applied fixes.
- No `any`, no `enum`, no circular imports detected.
- `.ts` import extensions are inconsistent: Phase 2 parser files use them, `main.ts` does not. Both styles compile; defer standardisation to Phase 8 polish.

---

## Doc References Used

- None fetched this pass — all findings were derived from static code inspection and existing skill files.

---

## Fixes Applied

Both medium/low code fixes were applied directly to `src/main.ts`:

1. `src/main.ts` line 45 — `this.fileWatcher.destroy()` → `this.fileWatcher?.destroy()`
2. `src/main.ts` lines 43-47 — `await this.flushToVault()` wrapped in try/catch

---

## Suggestions

- `src/store/MarkdownSerializer.ts` — fix `serializeIncomeLine` to include the `note` field before Phase 4 modals start writing income records; otherwise notes entered via modal will vanish on the next flush.
- `src/main.ts` `FinanceTrackerSettingTab.display()` — add a non-empty guard on the currency `onChange` handler to prevent saving `""` as the currency.

---

## Skills Authored

| File | Purpose |
|---|---|
| `skills/obsidian-plugin-lifecycle.md` | `onload`/`onunload` async patterns, field guard with `?.`, `registerEvent` contract |
| `skills/obsidian-vault-api.md` | `getFileByPath` null-check, `read`/`modify`/`create` error handling, `isWriting` guard pattern |
| `skills/obsidian-settings.md` | `loadData`/`saveData` spread pattern, `display()` empty-first, `onChange` input validation |
