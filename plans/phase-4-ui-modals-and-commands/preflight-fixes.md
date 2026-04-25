# Phase 4 Pre-Flight Fixes

Applied before menelik starts Phase 4. All issues flagged by sokrates are resolved.

---

## Fix 1 — `currency` field missing from modal form state (Blocker)

**File:** `plans/phase-4-ui-modals-and-commands/implementation.md`

All three input schemas (`ExpenseInputSchema`, `IncomeInputSchema`, `DebtInputSchema`) require `currency: string(3)`. The modal forms never collect it, so every `safeParse` call would fail with a `currency` validation error.

**Applied:** In `handleSubmit()`, spread `currency: this.plugin.settings.currency` into a `payload` object before calling `safeParse`. Added a note that the same pattern applies to `AddIncomeModal` and `AddDebtModal`.

---

## Fix 2 — `registerCommands()` conflict and ribbon button stubs (Blocker)

**File:** `plans/phase-4-ui-modals-and-commands/implementation.md`

The plan said to call `registerCommands(this)` from `main.ts` without specifying that the existing private `registerCommands()` method must be removed. Also, `registerRibbonButtons()` still had Notice stubs but `validation.md` checks that ribbon buttons open modals.

**Applied:** Added explicit instructions to:
- Remove the private `registerCommands()` method from `main.ts` entirely
- Replace it with the imported `registerCommands(this)` call
- Update `registerRibbonButtons()` with the real modal-opening implementation
- Add the four required imports to `main.ts`

---

## Fix 3 — `Enter` key binding was missing as an implementation step

**File:** `plans/phase-4-ui-modals-and-commands/implementation.md`

`research.md` documented `this.scope.register([], 'Enter', ...)` but it was never listed as a step to implement. `validation.md` checks keyboard accessibility.

**Applied:** Added `this.scope.register([], 'Enter', ...)` call after the submit button block, with a note to register it in `onOpen()` after `buildForm()`.

---

## Fix 4 — Wrong `styles.css` manifest claim

**File:** `plans/phase-4-ui-modals-and-commands/implementation.md`

The plan stated `styles.css` is "automatically loaded if listed in manifest.json (it is by default)." `manifest.json` has no such field — Obsidian loads `styles.css` automatically purely by file presence next to `main.js`.

**Applied:** Corrected the description to the accurate Obsidian behavior.

---

## TypeScript impact

No code changes — all fixes are plan/documentation only. `tsc --noEmit --strict` remains clean from Phase 3.

Phase 4 is now CLEAR TO IMPLEMENT.
