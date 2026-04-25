# Phase 3 — Plugin Core: Validation Checklist

All checks below must pass before Phase 3 is considered complete.

---

## Build Check

- [ ] `npm run build` (or `bun run build`) completes with zero errors
- [x] `tsc --noEmit --strict` is clean on `src/main.ts`
- [ ] `main.js` is generated in the project root
- [x] No `any` in `src/main.ts`
- [ ] ~~Import extension consistency (.ts extensions)~~ — ❌ (deferred to Phase 8)

---

## Manual Load Test (Obsidian Dev Vault)

Copy `main.js`, `manifest.json` to `.obsidian/plugins/obsidian-finance-tracker/` in a dev vault.

- [ ] Plugin appears in Settings → Community Plugins (manual)
- [ ] Enabling plugin produces no errors in the developer console (Ctrl+Shift+I) (manual)
- [ ] `finance-ledger.md` is created in vault root on first enable (if it didn't exist) (manual)
- [ ] Created file contains valid frontmatter and three empty sections (manual)

---

## Ribbon Buttons

- [ ] Three ribbon icons are visible in the left sidebar (manual)
- [ ] Hovering each shows the correct tooltip text (manual)
- [ ] Clicking "Add Expense" shows a Notice (manual)
- [ ] Clicking "Add Income" shows a Notice (manual)
- [ ] Clicking "Add Debt" shows a Notice (manual)
- [ ] No console errors when clicking buttons (manual)

---

## Command Palette

- [ ] Opening command palette (Ctrl+P) and typing "Finance" shows all three commands (manual)
- [ ] "Finance Tracker: Add Expense" appears and is triggerable (manual)
- [ ] "Finance Tracker: Add Income" appears and is triggerable (manual)
- [ ] "Finance Tracker: Add Debt" appears and is triggerable (manual)

---

## Settings Tab

- [ ] Settings tab appears under Settings → Plugin Options → Finance Tracker (manual)
- [ ] Three fields are visible: Ledger file path, Export directory, Default currency (manual)
- [ ] Changing a field value and closing settings persists the value (manual)
- [ ] Reopening settings shows the persisted value (manual)
- [ ] Disabling and re-enabling the plugin retains settings (manual)

---

## Ledger Load

- [ ] Populate `finance-ledger.md` with a few valid entries and reload the plugin (manual)
- [ ] `store.getExpenses().length > 0` after reload (verify via a temporary `console.log` in `onload`) (manual)
- [ ] Ledger with parse errors shows Notice with error count (manual)
- [ ] Plugin still loads despite parse errors (manual)

---

## Clean Unload

- [ ] Disable plugin from Settings → no console errors (manual)
- [ ] Re-enable plugin → works as before (manual)

---

## Phase Exit Criteria

- [ ] Build passes
- [x] `tsc --noEmit --strict` clean
- [ ] Plugin loads in Obsidian dev vault without errors (manual)
- [ ] All ribbon buttons and commands are registered and clickable (manual)
- [ ] Settings persist across restarts (manual)
- [ ] Ledger is parsed on load; errors are surfaced gracefully (manual)
- [ ] Plugin unloads cleanly (manual)
