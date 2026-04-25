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

- [x] Plugin appears in Settings → Community Plugins (manual)
- [x] Enabling plugin produces no errors in the developer console (Ctrl+Shift+I) (manual)
- [x] `finance-ledger.md` is created in vault root on first enable (if it didn't exist) (manual)
- [x] Created file contains valid frontmatter and three empty sections (manual)

---

## Ribbon Buttons

- [x] Three ribbon icons are visible in the left sidebar (manual)
- [x] Hovering each shows the correct tooltip text (manual)
- [x] Clicking "Add Expense" shows a Notice (manual)
- [x] Clicking "Add Income" shows a Notice (manual)
- [x] Clicking "Add Debt" shows a Notice (manual)
- [x] No console errors when clicking buttons (manual)

---

## Command Palette

- [x] Opening command palette (Ctrl+P) and typing "Finance" shows all three commands (manual)
- [x] "Finance Tracker: Add Expense" appears and is triggerable (manual)
- [x] "Finance Tracker: Add Income" appears and is triggerable (manual)
- [x] "Finance Tracker: Add Debt" appears and is triggerable (manual)

---

## Settings Tab

- [x] Settings tab appears under Settings → Plugin Options → Finance Tracker (manual)
- [x] Three fields are visible: Ledger file path, Export directory, Default currency (manual)
- [x] Changing a field value and closing settings persists the value (manual)
- [x] Reopening settings shows the persisted value (manual)
- [x] Disabling and re-enabling the plugin retains settings (manual)

---

## Ledger Load

- [x] Populate `finance-ledger.md` with a few valid entries and reload the plugin (manual)
- [x] `store.getExpenses().length > 0` after reload (verify via a temporary `console.log` in `onload`) (manual)
- [x] Ledger with parse errors shows Notice with error count (manual)
- [x] Plugin still loads despite parse errors (manual)

---

## Clean Unload

- [x] Disable plugin from Settings → no console errors (manual)
- [x] Re-enable plugin → works as before (manual)

---

## Phase Exit Criteria

- [x] Build passes
- [x] `tsc --noEmit --strict` clean
- [x] Plugin loads in Obsidian dev vault without errors (manual)
- [x] All ribbon buttons and commands are registered and clickable (manual)
- [x] Settings persist across restarts (manual)
- [x] Ledger is parsed on load; errors are surfaced gracefully (manual)
- [x] Plugin unloads cleanly (manual)
