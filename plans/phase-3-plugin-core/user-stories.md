# Phase 3 — Plugin Core: User Stories

## Story 1 — Plugin loads on first use

**As a** user who just copied the plugin files into `.obsidian/plugins/`,  
**I want** the plugin to load without errors and create a starter ledger file,  
**So that** I can start using it immediately without any manual setup.

**Acceptance criteria:**
- Plugin enables in Obsidian Settings → Community Plugins without error
- `finance-ledger.md` is created in the vault root if it doesn't exist
- The created file contains valid frontmatter and empty `## Expenses`, `## Income`, `## Debts` sections
- No errors in the Obsidian developer console

---

## Story 2 — Plugin loads existing ledger data on startup

**As a** user who already has entries in `finance-ledger.md`,  
**I want** the plugin to parse the file and load all records into memory on startup,  
**So that** the dashboard and future searches reflect my existing data.

**Acceptance criteria:**
- On `onload()`, the ledger file is read and `store.getExpenses()` returns parsed expenses
- If the ledger has parse errors, a Notice appears with the error count and errors are logged to the console
- Plugin still loads and functions despite parse errors (partial load)

---

## Story 3 — Ribbon buttons are visible

**As a** user who wants quick access to data entry,  
**I want** three ribbon buttons in the Obsidian left sidebar (Add Expense, Add Income, Add Debt),  
**So that** I can open the right form with one click without using the command palette.

**Acceptance criteria:**
- Three icons appear in the Obsidian ribbon
- Each has a tooltip describing its action
- Clicking each shows a Notice (Phase 3 placeholder — full modal in Phase 4)

---

## Story 4 — Commands appear in the command palette

**As a** user who prefers keyboard navigation,  
**I want** "Finance Tracker: Add Expense", "Finance Tracker: Add Income", and "Finance Tracker: Add Debt" in the command palette,  
**So that** I can add records without touching the mouse.

**Acceptance criteria:**
- All three commands appear when searching "Finance" in the Obsidian command palette
- Each command is triggered correctly from the palette

---

## Story 5 — Settings are saved and reloaded between restarts

**As a** user who wants to store the ledger in a custom location,  
**I want** to change the ledger path in settings and have it remembered after Obsidian restarts,  
**So that** I don't have to reconfigure the plugin after each session.

**Acceptance criteria:**
- Settings tab opens from Obsidian Settings → Plugin Options → Finance Tracker
- Changing `ledgerPath`, `exportDirectory`, or `currency` and closing settings persists the value
- After Obsidian restart, the plugin loads the ledger from the path specified in settings

---

## Story 6 — Plugin unloads cleanly

**As a** user disabling the plugin or closing Obsidian,  
**I want** any pending writes to be flushed to the ledger file before the plugin stops,  
**So that** I never lose a record I just added because the plugin closed mid-debounce.

**Acceptance criteria:**
- `onunload()` flushes a pending write if `saveTimer` is active
- No errors in the console on plugin disable
- After disable + re-enable, all records added in the previous session are present

---

## Story 7 — Parse errors are surfaced clearly

**As a** user who manually edited the ledger and introduced a typo,  
**I want** a clear warning when the plugin loads showing how many lines failed to parse,  
**So that** I know to open the ledger file and fix the problem.

**Acceptance criteria:**
- If `deserialize()` returns `errors.length > 0`, a Notice appears: "Ledger loaded with N parse error(s). Check console."
- Each error is logged to the developer console with line number and raw line content
- Valid records are still loaded despite errors
