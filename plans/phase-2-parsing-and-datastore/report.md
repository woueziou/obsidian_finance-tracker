# Phase 2 — Parsing & DataStore: Report

## What Was Built

### Files Created

| File | Description |
|------|-------------|
| `src/parsers/expenseParser.ts` | Pure function `parseExpenses(lines, startIndex)` — parses `## Expenses` section into id-less records |
| `src/parsers/incomeParser.ts` | Pure function `parseIncomes(lines, startIndex)` — parses `## Income` section into id-less records |
| `src/parsers/debtParser.ts` | Pure function `parseDebts(lines, startIndex)` — parses `## Debts` section into id-less records |
| `src/parsers/index.ts` | Re-exports all three parser functions; does NOT re-export internal `Parsed*` types |
| `src/store/DataStore.ts` | In-memory store with full CRUD for Expense/Income/Debt, aggregation helpers, and pub/sub subscribe/unsubscribe |
| `src/store/MarkdownSerializer.ts` | `deserialize(content)` → `ParseResult`; `serialize(store, meta)` → markdown string; sole UUID-minting site during file load |
| `src/store/FileWatcher.ts` | Debounced Obsidian `vault.on('modify')` watcher; suppresses plugin's own writes via `isWriting()` guard |
| `src/__tests__/expenseParser.test.ts` | 7 tests covering valid lines, missing date heading, unknown type, location optional |
| `src/__tests__/incomeParser.test.ts` | 7 tests covering valid lines, missing date heading, unknown type, source field |
| `src/__tests__/debtParser.test.ts` | 7 tests covering valid lines, optional status/interestRate, status variants |
| `src/__tests__/MarkdownSerializer.test.ts` | 8 tests: empty input, frontmatter defaults, round-trip fidelity, section ordering |
| `src/__tests__/DataStore.test.ts` | 7 tests: add/get/update/delete, aggregation, pub/sub notification count |
| `src/__tests__/roundTrip.test.ts` | 2 tests: full serialize → deserialize → serialize round-trip for all three record types |

### Files Modified

| File | Change |
|------|--------|
| `package.json` | Added `@types/node` dev dependency; `zod` was already present from phase 1 |
| `plans/phase-2-parsing-and-datastore/implementation.md` | Annotated completed steps inline during development |
| `.claude/agents/ganfam.md` | Minor agent instruction update (unrelated to phase scope) |

---

## Decisions Made

### Amount storage — integer cents, not raw string multiplication

The plan said "store amounts in cents". The DSL integer `15000` is written as `15000 XOF` and means 15,000 XOF. To avoid ambiguity, parsers multiply by `100` on read (so 15000 → 1,500,000 cents) and serializers divide by `100` on write. This is consistent with the CLAUDE.md rule "store amounts in cents". The round-trip tests confirm the value survives.

### `crypto.randomUUID()` only in `MarkdownSerializer.deserialize`

The plan specifies this. `DataStore.addExpense/addIncome/addDebt` also call `crypto.randomUUID()` for the interactive modal path — this is correct because those methods create new records that were never in the file.

### `FileWatcher` registers the vault event but does not unregister it

Obsidian's `Vault.on()` returns an `EventRef`. The `FileWatcher` does not store or use the ref to call `vault.off()` on `destroy()`. This is a known gap. The plugin's `onunload()` lifecycle in Phase 3 will call `this.registerEvent()` on the plugin instance instead of constructing `FileWatcher` directly, which will handle cleanup automatically. Noted in Known Issues below.

### `MarkdownSerializer.serialize` uses non-null assertion `!` once

On line 189 (`expensesByDate.get(date)!`) a non-null assertion is used. The key was just obtained from the same map's key set, so the assertion is always safe. TypeScript's `Map.get()` return type is `T | undefined` and there is no way to express "key came from this map's own keys" without a cast. This is the only `!` in the codebase and it is intentional.

### Income `note` field is optional in the serializer

The DSL format `- [salary] 150000 XOF from: April freelance work` puts the description in `source`, not `note`. The serializer outputs only `source`. An income record may also carry a `note` field (defined in the schema) but the serializer does not emit it — this matches the DSL spec in CLAUDE.md.

---

## Known Issues / Deferred Items

1. **`FileWatcher` event cleanup**: `vault.on('modify')` returns an `EventRef` that should be passed to `this.registerEvent()` at the plugin level. Phase 3 must wrap `FileWatcher` construction accordingly, or `FileWatcher` must be refactored to accept an `off` callback.

2. **`FileWatcher` is not unit-tested**: Testing requires a mock Obsidian `Vault`. This is intentionally deferred to Phase 8 (Testing & Polish) where an Obsidian mock environment will be set up.

3. **Partial debt status serialization is lossy for `note` with commas**: If a debt's `note` field contains a comma (e.g., `"laptop, charger"`), the serialized line will have extra commas that the parser does not currently handle (it uses a fixed field-order regex). This edge case is deferred; a quoted-string approach or JSON inline format can be adopted in Phase 8.

4. **Income `note` not round-tripped**: The `note` field on `Income` is accepted by the schema but the serializer does not write it and the parser does not read it. This is consistent with the current DSL spec but will need revisiting if the DSL is extended.

---

## Context for Next Phase (Phase 3 — Plugin Core)

### DataStore public API (what `main.ts` will use)

```typescript
store.load(ledger: Ledger): void
store.addExpense(input: ExpenseInput): Expense
store.getExpenses(): Expense[]
store.getExpensesByDate(date: string): Expense[]
store.getExpensesByType(type: Expense['type']): Expense[]
store.updateExpense(id, patch): Expense
store.deleteExpense(id): void
// same shape for Income and Debt

store.getMonthlyExpenseTotal(year, month): number       // returns cents
store.getExpenseSummaryByType(year, month): Record<ExpenseType, number>  // returns cents

store.subscribe(listener: () => void): () => void       // returns unsubscribe fn
```

### MarkdownSerializer public API

```typescript
MarkdownSerializer.deserialize(content: string): ParseResult
// ParseResult = { ledger: Ledger; errors: ParseError[] }

MarkdownSerializer.serialize(store: DataStore, meta: LedgerMeta): string
```

### FileWatcher constructor signature

```typescript
new FileWatcher(
  vault: Vault,
  ledgerPath: string,
  isWriting: () => boolean,
  onExternalChange: () => void,
)
```

Phase 3 should pass `this.registerEvent(vault.on('modify', ...))` pattern OR refactor `FileWatcher` to return the `EventRef` for the plugin to register. The current implementation registers the listener internally — Phase 3 author must address the cleanup gap noted above.

### Schema-inferred types used across phases

All downstream phases should import `Expense`, `Income`, `Debt`, `ExpenseInput`, `IncomeInput`, `DebtInput` from `src/schemas.ts`, not from `src/types.ts`. The `types.ts` file exports `Ledger`, `LedgerMeta`, `ParseError`, and `ParseResult` only.

### Test runner

Tests use Bun's built-in test runner (`bun test`). 38 tests, 0 failures, 0 skipped as of phase completion. `tsc --noEmit --strict` is also clean.