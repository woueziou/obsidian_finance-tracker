# Phase 3 — Plugin Core: Validation Checklist

All checks below must pass before Phase 3 is considered complete.

---

## Build Check

- [ ] `npm run build` (or `bun run build`) completes with zero errors
- [ ] `tsc --noEmit --strict` is clean on `src/main.ts`
- [ ] `main.js` is generated in the project root
- [ ] No `any` in `src/main.ts`

---

## Manual Load Test (Obsidian Dev Vault)

Copy `main.js`, `manifest.json` to `.obsidian/plugins/obsidian-finance-tracker/` in a dev vault.

- [ ] Plugin appears in Settings → Community Plugins
- [ ] Enabling plugin produces no errors in the developer console (Ctrl+Shift+I)
- [ ] `finance-ledger.md` is created in vault root on first enable (if it didn't exist)
- [ ] Created file contains valid frontmatter and three empty sections

---

## Ribbon Buttons

- [ ] Three ribbon icons are visible in the left sidebar
- [ ] Hovering each shows the correct tooltip text
- [ ] Clicking "Add Expense" shows a Notice
- [ ] Clicking "Add Income" shows a Notice
- [ ] Clicking "Add Debt" shows a Notice
- [ ] No console errors when clicking buttons

---

## Command Palette

- [ ] Opening command palette (Ctrl+P) and typing "Finance" shows all three commands
- [ ] "Finance Tracker: Add Expense" appears and is triggerable
- [ ] "Finance Tracker: Add Income" appears and is triggerable
- [ ] "Finance Tracker: Add Debt" appears and is triggerable

---

## Settings Tab

- [ ] Settings tab appears under Settings → Plugin Options → Finance Tracker
- [ ] Three fields are visible: Ledger file path, Export directory, Default currency
- [ ] Changing a field value and closing settings persists the value
- [ ] Reopening settings shows the persisted value
- [ ] Disabling and re-enabling the plugin retains settings

---

## Ledger Load

- [ ] Populate `finance-ledger.md` with a few valid entries and reload the plugin
- [ ] `store.getExpenses().length > 0` after reload (verify via a temporary `console.log` in `onload`)
- [ ] Ledger with parse errors shows Notice with error count
- [ ] Plugin still loads despite parse errors

---

## Clean Unload

- [ ] Disable plugin from Settings → no console errors
- [ ] Re-enable plugin → works as before

---

## Phase Exit Criteria

- [ ] Build passes
- [ ] Plugin loads in Obsidian dev vault without errors
- [ ] All ribbon buttons and commands are registered and clickable
- [ ] Settings persist across restarts
- [ ] Ledger is parsed on load; errors are surfaced gracefully
- [ ] Plugin unloads cleanly
