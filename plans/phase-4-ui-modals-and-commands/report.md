# Phase 4 — UI Modals & Commands: Report

## What Was Built

### Files Created
- `src/commands/addExpense.ts` — `AddExpenseModal` extending Obsidian `Modal`. Fields: date (pre-filled with today), amount, type dropdown, note, location (optional). Validates via `ExpenseInputSchema.safeParse`, injects `currency` from plugin settings, writes errors inline, closes on success. Enter key bound via `this.scope.register`.
- `src/commands/addIncome.ts` — `AddIncomeModal`. Fields: date, amount, type dropdown, source (required), note. Same validation/write pattern as expense.
- `src/commands/addDebt.ts` — `AddDebtModal`. Fields: amount, dueDate, person, note, status dropdown (defaults to `open`), interestRate (optional, parsed as `parseFloat`). No date pre-fill since debts use `dueDate` rather than an entry date.
- `src/commands/index.ts` — `registerCommands(plugin)` exports three `plugin.addCommand` registrations: `add-expense`, `add-income`, `add-debt`.
- `styles.css` — `.finance-tracker-error` rule using `var(--color-red)` and `var(--background-modifier-error)` Obsidian CSS variables.

### Files Modified
- `src/main.ts` — removed the private `registerCommands()` stub; replaced its call site in `onload()` with `registerCommands(this)` (imported from `./commands/index`). Updated `registerRibbonButtons()` to open the real modals instead of stub `Notice` calls. Added imports for `registerCommands`, `AddExpenseModal`, `AddIncomeModal`, `AddDebtModal`.

## Decisions Made

- **No deviation from plan.** All fields, dropdown values, validation flow, currency injection, and CSS class match `implementation.md` exactly.
- **`interestRate` parsed with `parseFloat`** for the debt modal as specified, supporting decimal values such as `5.0` or `12.5`.
- **`styles.css` placed at project root** alongside `main.ts` and `manifest.json`. Obsidian loads it automatically — no manifest change needed.
- **Dropdown default for `status`** in `AddDebtModal` is set to `open` via `.setValue('open')` after the `addOptions` call, so the `formData` field is initialized immediately without waiting for user interaction.

## Known Issues / Deferred Items

- All validation checklist items require manual testing inside Obsidian. The `tsc --noEmit --strict` build check is the only automated gate available before deployment.
- The error display shows all Zod issue messages concatenated with `\n`. A more polished per-field inline error approach is deferred to Phase 8 (polish).
- No duplicate-submission guard exists. Rapid double-clicking the submit button could call `store.addExpense` twice. Debouncing or disabling the button after the first click is deferred to Phase 8.
- `scheduleWrite()` is called directly on the plugin. If DataStore write fails (e.g. vault read/write error), the modal has already closed and the user sees no error feedback. Proper error handling is deferred to Phase 8.

## Context for Next Phase

### Phase 5 — Dashboard View

- `plugin.store` is the live `DataStore` instance. Subscribe to it via `store.subscribe(callback)` in the view's `onOpen`, and unsubscribe in `onClose`.
- `plugin.settings.currency` holds the configured currency string (default `'XOF'`). Use it when formatting amounts for display.
- Amounts in the DataStore are stored in **cents** (e.g. a form entry of `15000` becomes `1500000` cents). Divide by 100 for display.
- `registerCommands` is the single entry point for all command palette entries. If the dashboard needs its own command (e.g. "Open Dashboard"), add it to `src/commands/index.ts` and import `DashboardView` there — or add a separate `plugin.addCommand` call directly in `main.ts` `onload()` alongside the `registerCommands(this)` call.
- `styles.css` is already established. Add dashboard-specific CSS rules to the same file; Obsidian merges the single stylesheet.
