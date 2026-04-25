# Phase 2 — Parsing & DataStore: ganfam Review

## Verdict
PASS WITH WARNINGS

## Bugs Found
- `src/store/MarkdownSerializer.ts:70,74,78` — `amount / 100` produces decimals for non-round cent values; parser's `\d+` regex silently drops the record on round-trip. Fix: use `Math.round(amount / 100)`.
- `src/store/FileWatcher.ts:16` — `vault.on('modify', ...)` EventRef never stored; `destroy()` cannot call `vault.off()`. Listener leaks on plugin reload. Fix: store EventRef, call `this.vault.off(this.eventRef)` in `destroy()`.
- `src/parsers/debtParser.ts:38-39` — Debt note containing a comma causes the full DEBT_LINE regex to fail with no ParseError pushed — silent data loss. Fix: after `if (debtMatch === null) continue;`, check if line starts with `- amount:` and push a ParseError.
- `src/store/MarkdownSerializer.ts:171` — `serialize` writes today's date; determinism guarantee breaks at midnight. Design note, not a code bug.
- `src/parsers/expenseParser.ts:62-70` — Minor: error message for "before date heading" case is inaccurate for unknown-type lines.

## Plan Gaps
- `debtParser`: malformed due date (e.g. `due: 26-4-1`) fails DEBT_LINE regex with no ParseError — silently skipped.
- `incomeParser.ts:85`: `note` field is set to `source` text — redundant data, accepted per DSL but surprising for downstream readers.
- `debtParser.test.ts`: no test for "invalid due date → ParseError" — validation checklist item uncovered.
- `MarkdownSerializer.test.ts`: "no trailing whitespace" test covers expenses only; income/debt serialization paths not tested.

## TypeScript Issues
None — `tsc --noEmit --strict` exits clean, zero errors. No `any`, no `enum`, no circular imports.

## Doc References Used
None fetched — existing skills and plan files were sufficient.

## Suggestions
1. `MarkdownSerializer.ts:70,74,78` — change `e.amount / 100` to `Math.round(e.amount / 100)` (critical — prevents round-trip data loss)
2. `FileWatcher.ts` — add `private eventRef!: EventRef;`, store return of `vault.on(...)`, add `this.vault.off(this.eventRef)` in `destroy()`
3. `debtParser.ts:38-39` — push ParseError for any `- amount:` line that fails DEBT_LINE regex
4. Add `debtParser.test.ts` test: malformed due date → ParseError
5. Add serializer whitespace test covering income and debt sections