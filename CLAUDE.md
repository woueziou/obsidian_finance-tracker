
## Project: Obsidian Finance Tracker Plugin

A TypeScript-based Obsidian plugin for personal finance tracking. Target user: solo developer/freelancer in West Africa (Togo) tracking daily expenses, income, and debts.

### Tech Stack

- **Language**: TypeScript strict mode — no `any`
- **Framework**: Obsidian API + esbuild
- **Validation**: Zod
- **Parsing**: Custom regex + state machine (no parser generators)
- **Storage**: Obsidian Vault filesystem API
- **Visualization**: Chart.js via CDN
- **No external services**: all processing local, no cloud APIs

### Project Structure

```
src/
├── main.ts                  # Plugin entry point
├── types.ts                 # Expense, Income, Debt, Ledger interfaces
├── schemas.ts               # Zod validation schemas
├── parsers/                 # expenseParser, incomeParser, debtParser
├── store/                   # DataStore, MarkdownSerializer, FileWatcher
├── commands/                # addExpense, addIncome, addDebt commands + modals
├── views/                   # DashboardView, LedgerView, ChartView
├── export/                  # CSV/JSON/SQL exporters and importers
└── utils/                   # dateParser, validators, formatters, analytics
```

### Markdown DSL

**Expenses**
```markdown
## Expenses

### 2026-04-25
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly
```

**Income**
```markdown
## Income

### 2026-04-25
- [salary] 150000 XOF from: April freelance work
```

**Debts**
```markdown
## Debts

- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan
```

**Frontmatter**
```markdown
---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---
```

### Key Implementation Rules

- Store amounts in **cents** (integers) to avoid floating-point issues
- Store dates as ISO 8601 strings (`YYYY-MM-DD`)
- Use `crypto.randomUUID()` for IDs
- Ledger file: vault root `finance-ledger.md` (configurable)
- Use `this.app.vault.read()` / `this.app.vault.modify()` for file I/O
- Debounce writes 1–2 seconds; never write on every keystroke
- Lazy-load Chart.js only when dashboard opens
- Unsubscribe from store subscriptions when views close

### Record Types

- **Expense**: id, date, amount (cents), type (subscription|food|misc|utility|transport), note, location
- **Income**: id, date, amount (cents), type (salary|donation|loan|investment|other), note, source
- **Debt**: id, amount (cents), dueDate, person, note, status (open|partial|paid), interestRate?

### Implementation Phases

1. **Types & Validation** — `types.ts`, `schemas.ts` (CRITICAL)
2. **Parsing & DataStore** — parsers, DataStore, MarkdownSerializer (CRITICAL)
3. **Plugin Core** — `main.ts`, ribbon buttons, settings tab (HIGH)
4. **UI Modals** — AddExpense/Income/Debt commands + modals (HIGH)
5. **Dashboard** — sidebar view, Chart.js charts, live updates (MEDIUM)
6. **Export/Import** — CSV, JSON, SQL round-trips (MEDIUM)
7. **Analytics** — monthly trends, category breakdowns, debt tracker (LOW)
8. **Testing & Polish** — unit + integration tests, README (MEDIUM)

---

### Development Workflow

#### Starting a Phase

1. **Discuss first** — before writing any code, review the phase's `context.md` and `research.md` with the user. Ask: "Should we update context or research before starting?" Make any agreed updates before branching.
2. **Create a branch** named after the phase:
   ```
   git checkout -b phase-1-types-and-validation
   git checkout -b phase-2-parsing-and-datastore
   # etc.
   ```
   Branch off from the parent branch of the current phase (usually `main` for Phase 1, or the previous phase's branch if sequential).

#### During a Phase

- After completing each meaningful unit of work (a file, a feature, a test suite), **suggest a commit message** based on what was done. Do not commit silently — always present the message for approval first.
- Follow the plan in `plans/<phase-name>/implementation.md`. If deviation is needed, explain why before proceeding.

#### Finishing a Phase

1. Verify all items in `plans/<phase-name>/validation.md` are checked off.
2. **Write a report file** at `plans/<phase-name>/report.md` capturing:
   - What was built and what files were created/modified
   - Decisions made that deviated from the plan (and why)
   - Known issues or deferred items
   - Context the next phase needs to know (especially DataStore API changes, type renames, etc.)
3. **Open a pull request** against the parent branch:
   ```
   gh pr create --title "Phase N: <phase name>" --body "..."
   ```
   PR description should reference the report file and list the validation checklist status.

#### Agents

Agents are loaded **on demand** via slash commands. Do not auto-invoke them.

| Command | Agent | Purpose |
|---|---|---|
| `/menelik` | menelik | Implementation — coding, branching, PRs |
| `/ganfam` | ganfam | Validation — bug detection, plan gaps, doc cross-checks |

**menelik** — all implementation tasks. Invoke when the user says "start phase N", "implement [feature]", or `/menelik`.
- Reads phase plan files before starting work
- Follows branch → implement → suggest commit → PR workflow
- Does not commit or open PRs without user confirmation

**ganfam** — post-implementation review. Invoke when the user says "review phase N", "validate [feature]", or `/ganfam`.
- Reads `plans/<phase>/implementation.md` and `validation.md` to find gaps
- Runs `tsc --noEmit --strict` and inspects code for bugs
- Checks `docs/remote-resources.md` for relevant documentation; fetches docs via WebFetch to cross-validate the implementation
- Writes `plans/<phase>/ganfam-review.md` with verdict, bugs, and concrete fix suggestions
- Presents findings to user before saving the review file

#### Remote Resources

Documentation links live in `docs/remote-resources.md`. Each entry has:
- **title** (heading)
- **tags** — for lookup by domain (obsidian, zod, chartjs, typescript…)
- **url**
- **description** — one sentence on when to reach for it

ganfam reads this file before every validation pass. To add a new doc, supply a URL and ganfam will append it in the correct format.
