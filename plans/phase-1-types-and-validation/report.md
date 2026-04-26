# Phase 1 — Types & Validation: Report

## What Was Built

- `src/types.ts` — TypeScript interfaces and string unions:
  - `ExpenseType`, `IncomeType`, `DebtStatus` (string unions, no `enum` keyword)
  - `Expense`, `Income`, `Debt` record interfaces (amounts in cents, dates as ISO 8601 strings)
  - `LedgerMeta`, `Ledger`, `ParseError`, `ParseResult` container interfaces
  - `PluginSettings` interface and `DEFAULT_SETTINGS` constant

- `src/schemas.ts` — Zod validation schemas:
  - `ExpenseTypeSchema`, `IncomeTypeSchema`, `DebtStatusSchema` (z.enum)
  - `ExpenseSchema`, `IncomeSchema`, `DebtSchema` with full field validation
  - `LedgerMetaSchema` with sensible defaults
  - `ExpenseInputSchema`, `IncomeInputSchema`, `DebtInputSchema` (id omitted, for modals)
  - Inferred TypeScript types re-exported: `Expense`, `Income`, `Debt`, `ExpenseInput`, `IncomeInput`, `DebtInput`

## Decisions Made

- `types.ts` defines the hand-written interfaces; `schemas.ts` infers types from Zod and re-exports them. This means the canonical `Expense`/`Income`/`Debt` types live in `schemas.ts` as Zod-inferred types, not in `types.ts`. Downstream code should import record types from `schemas.ts` and container/settings types from `types.ts`.

- `IncomeSchema` marks `source` as `z.string().min(1)` (required), matching the interface. The implementation plan showed `source` as a required field on the `Income` interface, and this was preserved.

- No `.default()` transform was added to currency fields — validation only, normalization is the caller's responsibility.

- `z.coerce.number()` was not used for amounts; any non-integer or non-positive value fails loudly with a `ZodError`.

## Known Issues / Deferred Items

- Schema rejection and acceptance tests from `validation.md` were verified manually during development but are not yet automated. A dedicated test suite is planned for Phase 8.

- `LedgerSchema` (combining all three record arrays with `LedgerMetaSchema`) is not defined in this phase. The DataStore in Phase 2 will compose schemas as needed.

## Context for Next Phase

- Import record types (`Expense`, `Income`, `Debt`, `ExpenseInput`, `IncomeInput`, `DebtInput`) from `src/schemas.ts`.
- Import container types (`Ledger`, `LedgerMeta`, `ParseError`, `ParseResult`) and settings (`PluginSettings`, `DEFAULT_SETTINGS`) from `src/types.ts`.
- `DebtSchema` applies `.default('open')` to `status`, so parsed debt objects always have a status even when the input omits it.
- `interestRate` is validated as `z.number().min(0).max(100).optional()` — a decimal percentage, not a basis-point integer.
- The `ISO_DATE_RE` constant is local to `schemas.ts`; if parsers need the same regex, define it independently or extract it to `src/utils/dateParser.ts` in Phase 2.
- `tsc --noEmit --strict` is clean as of the commit on this branch.
