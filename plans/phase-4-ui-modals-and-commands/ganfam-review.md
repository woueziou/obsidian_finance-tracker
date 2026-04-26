# Phase 4 — UI Modals & Commands: ganfam Review

## Verdict

PASS WITH WARNINGS

TypeScript is clean. All plan items are implemented. Two minor issues found in `addDebt.ts` — neither causes data corruption, both are surfaced to the user via validation errors. No blocker for merging.

---

## Bugs Found

### 1. `addDebt.ts:59` — dueDate empty-string produces misleading error

**What happens:** If the user focuses the Due Date field, types something, then clears it entirely, `onChange` fires with `''`. The handler sets `formData.dueDate = ''`. The schema at `schemas.ts:49` runs `z.string().regex(ISO_DATE_RE)` — the regex does not match an empty string, so the error message shown is `dueDate: Date must be YYYY-MM-DD`. For an empty field the user likely expects a "required" message, not a format hint.

**Suggested fix** (`addDebt.ts:59`):
```ts
.onChange(v => { this.formData.dueDate = v.trim() || undefined; });
```
Setting `undefined` on clear causes the schema to report `dueDate: Required` instead, which is unambiguous.

### 2. `addDebt.ts` / `addExpense.ts` / `addIncome.ts` — inconsistent dropdown default pattern

**What happens:** `addExpense.ts:75` and `addIncome.ts:75` initialize the type default imperatively after `.setValue()` (`this.formData.type = 'food'`), with no default in the `formData` initializer. `addDebt.ts` instead pre-initializes `status: 'open'` in the class-field initializer and never assigns it again after `.setValue('open')`. Both patterns are safe — `buildForm` is always called before `handleSubmit`. The inconsistency is a style issue, not a runtime bug.

**Suggested fix:** adopt the `addDebt.ts` pattern across all three modals — set the default in the `formData` class-field initializer and remove the post-`setValue` imperative assignment from `addExpense.ts:75` and `addIncome.ts:75`. This removes duplication and makes intent explicit.

---

## Plan Gaps

None. All steps in `implementation.md` are implemented exactly as described. Field lists, dropdown values, currency injection, Enter-key binding, CSS class, and `registerCommands` export all match the plan.

---

## TypeScript Issues

`npx tsc --noEmit --strict` is clean. No `any`, no `enum`, no circular imports detected.

---

## Doc References Used

No external documentation fetch was required for this phase. All validation was performed via direct code inspection against `implementation.md` and `schemas.ts`.

---

## Suggestions

- Apply the dueDate fix (`|| undefined`) before merging — it is a one-line change with no side effects.
- Standardise the dropdown default pattern in Phase 8 (polish) when refactoring the modal forms. It is low-priority but improves readability.
- Consider disabling the submit button after first click to guard against duplicate submissions (deferred to Phase 8 as noted in `report.md`).

---

## Skills Authored

None in this pass. Existing skills in `.claude/commands/` were sufficient.
