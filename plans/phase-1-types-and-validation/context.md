# Phase 1 — Types & Validation: Context

## Why This Phase Exists

Every other phase depends on a single, unambiguous answer to: "what shape does a financial record have?" Without that answer settled in code, parsers, modals, exporters, and the DataStore all make their own incompatible assumptions.

This phase establishes that answer as TypeScript interfaces (compile-time) and Zod schemas (runtime), so the compiler and the runtime enforce the same contract.

## What This Phase Covers

- `src/types.ts` — TypeScript interfaces and union types for all three record types
- `src/schemas.ts` — Zod schemas that mirror those interfaces, used for runtime validation everywhere data enters the system

## What This Phase Does NOT Cover

- Parsing markdown (Phase 2)
- Any Obsidian API usage (Phase 3)
- UI or modals (Phase 4)

## Inputs

- `docs/04-data-models.md` — canonical interface and schema definitions to implement from
- Project constraint: strict TypeScript, no `any`

## Outputs

- `src/types.ts` — compilable, no `any`
- `src/schemas.ts` — Zod schemas with inferred types
- Both files pass `tsc --noEmit --strict`

## Dependencies

None. This phase has no upstream code dependency — it is the foundation.

## Risk

Low. Pure TypeScript + Zod, no Obsidian API, no async code. The only risk is a naming inconsistency (e.g., `dueDate` vs `due_date`) that would ripple through all later phases. Decide names once here and never change them.

## Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Amount storage | `number` (cents, integer) | Avoids float precision issues |
| Date storage | `string` (ISO 8601) | Unambiguous, sortable, JSON-safe |
| IDs | `string` (UUID) | Enables deduplication on import |
| Optional fields | TypeScript `?` + Zod `.optional()` | `location` on Expense, `interestRate` on Debt |
| Input schemas | `ExpenseInputSchema` = schema without `id` | Modals don't generate IDs — DataStore does |
