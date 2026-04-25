
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
