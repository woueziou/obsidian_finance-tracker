# Phase 2 — Parsing & DataStore: Context

## Why This Phase Exists

Phase 1 defined what a financial record looks like. Phase 2 answers: how does the plugin get records from a markdown file into memory, and how does it write them back?

This is the most complex phase technically. It involves:
1. A custom DSL parser (state machine over lines)
2. An in-memory store with pub/sub
3. A serializer that produces deterministic, canonical markdown

Everything downstream — modals, dashboard, exporters — depends on these three components being correct and reliable.

## What This Phase Covers

- `src/parsers/expenseParser.ts` — parses `## Expenses` section lines
- `src/parsers/incomeParser.ts` — parses `## Income` section lines
- `src/parsers/debtParser.ts` — parses `## Debts` section lines
- `src/parsers/index.ts` — re-exports all parsers
- `src/store/DataStore.ts` — in-memory CRUD, aggregations, pub/sub
- `src/store/MarkdownSerializer.ts` — DataStore ↔ markdown string (bidirectional)
- `src/store/FileWatcher.ts` — detects external changes to the ledger file

## What This Phase Does NOT Cover

- Obsidian Plugin class registration (Phase 3)
- Any UI rendering (Phase 4+)
- Export file formats (Phase 6)

## Inputs

- `src/types.ts` and `src/schemas.ts` from Phase 1
- `docs/03-markdown-dsl.md` — full grammar specification
- `docs/06-implementation-notes.md` — parser state machine pseudocode, debounce pattern

## Outputs

- Seven source files listed above
- Round-trip parity: `deserialize(serialize(store))` produces the same records as the original store

## Risk

Medium-high. The parser is the most failure-prone component:
- Edge cases in the DSL (notes containing `:` or `@`, missing sections, extra blank lines)
- Re-entrant FileWatcher (plugin's own writes triggering reload)
- DataStore subscription leaks if views forget to unsubscribe

The round-trip integration test is the primary risk gate.
