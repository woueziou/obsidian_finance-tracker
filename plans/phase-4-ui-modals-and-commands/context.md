# Phase 4 — UI Modals & Commands: Context

## Why This Phase Exists

Phase 3 registered stub buttons and commands. Phase 4 replaces those stubs with real, validated form dialogs so the user can add records without ever editing the markdown file manually.

This is the first phase that directly serves the user's core daily workflow: "I just bought groceries, I want to record it in 5 seconds."

## What This Phase Covers

- `src/commands/addExpense.ts` — `AddExpenseModal` form + command callback
- `src/commands/addIncome.ts` — `AddIncomeModal`
- `src/commands/addDebt.ts` — `AddDebtModal`
- `src/commands/index.ts` — registers all three commands

## What This Phase Does NOT Cover

- Dashboard views (Phase 5)
- Edit/delete modals — MVP supports add only
- Export UI (Phase 6)

## Inputs

- Phase 1: `ExpenseInputSchema`, `IncomeInputSchema`, `DebtInputSchema`, type definitions
- Phase 2: `DataStore.addExpense()`, `DataStore.addIncome()`, `DataStore.addDebt()`
- Phase 3: plugin instance reference, `scheduleWrite()` method
- Obsidian API: `Modal`, `Setting`, `Notice`

## Outputs

- Three working modal dialogs, each with validated form fields
- On submit: record added to DataStore → debounced write to vault → success Notice
- On error: inline field messages + error Notice

## Risk

Low-medium. Obsidian's `Modal` API is simple. The main risk is validation UX — surfacing Zod errors in the right place in the form (next to the field, not just as a Notice). The modal must handle the case where the user submits without filling required fields.
