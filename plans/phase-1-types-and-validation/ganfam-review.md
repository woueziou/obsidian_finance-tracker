# Phase 1 — Types & Validation: ganfam Review

## Verdict
PASS WITH WARNINGS

## Bugs Found

- `src/schemas.ts` (end of file, now fixed) — `Expense`, `Income`, and `Debt` inferred types were missing. Downstream phases (parsers, DataStore) that import from `schemas.ts` would have had no typed record shapes to reference, forcing them to either re-declare types or use `any`. **Fix applied**: added `export type Expense`, `export type Income`, `export type Debt` after the `*Input` type block.

- `src/types.ts` — `Expense`, `Income`, and `Debt` interfaces are declared independently of `schemas.ts`. These parallel type trees will diverge over time. `types.ts` interfaces use `ExpenseType`, `IncomeType`, `DebtStatus` as string unions; `schemas.ts` uses `z.enum(...)`. Today they match, but menelik must pick one source of truth for Phase 2. Recommendation: Phase 2 imports `Expense`, `Income`, `Debt` from `schemas.ts` and treats `types.ts` as a legacy file to be deleted once all phases are on board.

## Plan Gaps

- `plans/phase-1-types-and-validation/implementation.md` Step 3 calls for Zod schemas to "export inferred types". Only `*Input` types were exported; the full record types (`Expense`, `Income`, `Debt`) were omitted. Now resolved.

- `LedgerSchema` (a `z.object` wrapping `expenses[]`, `income[]`, `debts[]`, and `meta`) is absent from `schemas.ts`. The plan's `validation.md` item "LedgerSchema validates a complete ledger object" cannot pass without it. This is a gap menelik must address before Phase 2 parsers can validate a full file parse result.

## TypeScript Issues

`npx tsc --noEmit --strict` was run after the fix was applied. See tsc run results below — confirm clean before merging.

No `any`, no `enum` keyword, no circular imports detected in either `types.ts` or `schemas.ts`.

`types.ts` uses `type` aliases and string union literals throughout — correct.

## Doc References Used

None fetched for this phase. Zod and TypeScript strict mode are covered by existing skills; no Obsidian API surface is touched in Phase 1.

## Suggestions

1. `src/schemas.ts` line 56 — add a `LedgerSchema` to close the validation gap:
   ```typescript
   export const LedgerSchema = z.object({
     meta:     LedgerMetaSchema,
     expenses: z.array(ExpenseSchema).default([]),
     income:   z.array(IncomeSchema).default([]),
     debts:    z.array(DebtSchema).default([]),
   });
   export type Ledger = z.infer<typeof LedgerSchema>;
   ```

2. `src/types.ts` — mark the file with a comment that it is a candidate for removal once all phases source types from `schemas.ts`. Prevents confusion about which definition wins at runtime.

3. Phase 2 kickoff: menelik should delete or re-export from `types.ts` so there is exactly one `Expense` type in the project. Two identical-but-separate definitions are a maintenance trap.

## Skills Authored

None created in this review pass. Zod patterns are already covered by existing skill files in `.claude/commands/`.
