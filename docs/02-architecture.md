# Architecture

## Module Map

```
src/
├── main.ts                        # Plugin lifecycle, registers everything
├── types.ts                       # Pure interfaces — no runtime code
├── schemas.ts                     # Zod schemas — runtime validation
│
├── parsers/
│   ├── expenseParser.ts           # string → Expense[]
│   ├── incomeParser.ts            # string → Income[]
│   ├── debtParser.ts              # string → Debt[]
│   └── index.ts                   # re-exports
│
├── store/
│   ├── DataStore.ts               # In-memory CRUD + aggregations + pub/sub
│   ├── MarkdownSerializer.ts      # DataStore ↔ markdown string
│   └── FileWatcher.ts             # vault.on('modify') → reload prompt
│
├── commands/
│   ├── addExpense.ts              # Modal + command
│   ├── addIncome.ts
│   ├── addDebt.ts
│   └── index.ts
│
├── views/
│   ├── DashboardView.ts           # Sidebar ItemView
│   ├── LedgerView.ts              # Full table view
│   └── ChartView.ts               # Chart.js wrappers
│
├── export/
│   ├── csvExporter.ts / csvImporter.ts
│   ├── jsonExporter.ts / jsonImporter.ts
│   ├── sqlExporter.ts / sqlImporter.ts
│   └── index.ts
│
└── utils/
    ├── dateParser.ts              # Flexible date parsing
    ├── validators.ts              # Custom validation helpers
    ├── formatters.ts              # Amount/date display formatting
    └── analytics.ts              # Aggregation queries
```

## Data Flow

### Startup

```
Plugin.onload()
  └── vault.read('finance-ledger.md')
        └── MarkdownSerializer.deserialize()
              ├── expenseParser.parse()
              ├── incomeParser.parse()
              └── debtParser.parse()
                    └── DataStore.load(expenses, incomes, debts)
```

### Add Record (via Modal)

```
User fills form → Modal.onSubmit()
  └── ZodSchema.parse(formData)          ← validation
        └── DataStore.addExpense(record)  ← in-memory update
              ├── notify all subscribers  ← triggers UI re-render
              └── scheduleWrite()         ← debounced 1.5s
                    └── MarkdownSerializer.serialize(store)
                          └── vault.modify('finance-ledger.md', content)
```

### External Edit (Git sync, mobile)

```
vault.on('modify', 'finance-ledger.md')
  └── FileWatcher detects change
        └── new Notice('Ledger changed externally. Reload?', actions)
              └── on confirm: full reload (same as startup)
```

### Dashboard View

```
DashboardView.onOpen()
  └── DataStore.subscribe(this.render)   ← registers listener
        └── this.render()                 ← initial render
              └── analytics.*()           ← compute stats
                    └── Chart.js render   ← lazy-loaded from CDN

DashboardView.onClose()
  └── unsubscribeFn()                    ← cleanup
```

## Dependency Graph

```
main.ts
  ├── types.ts          (no deps)
  ├── schemas.ts        (→ types.ts, zod)
  ├── store/DataStore   (→ types.ts)
  ├── store/MarkdownSerializer (→ DataStore, parsers/*)
  ├── store/FileWatcher (→ DataStore, Obsidian API)
  ├── commands/*        (→ DataStore, schemas.ts, Obsidian API)
  ├── views/*           (→ DataStore, utils/analytics, Obsidian API)
  ├── export/*          (→ DataStore, types.ts)
  └── utils/*           (→ types.ts only)
```

Key rule: `utils/` and `types.ts` have **no inward deps** — they're pure helpers importable anywhere without cycles.

## DataStore Interface (sketch)

```typescript
class DataStore {
  // CRUD
  addExpense(e: Expense): void
  getExpenses(): Expense[]
  getExpenseById(id: string): Expense | undefined
  getExpensesByDate(date: string): Expense[]
  getExpensesByType(type: ExpenseType): Expense[]
  updateExpense(id: string, patch: Partial<Expense>): void
  deleteExpense(id: string): void

  // same shape for Income and Debt

  // Aggregations
  getMonthlyExpenseTotal(year: number, month: number): number  // cents
  getExpenseSummaryByType(year: number, month: number): Record<ExpenseType, number>
  getMonthlyIncomeTotal(year: number, month: number): number
  getOpenDebts(): Debt[]

  // Pub/sub
  subscribe(listener: () => void): () => void  // returns unsubscribe fn
  private notify(): void
}
```

## Settings Shape

```typescript
interface PluginSettings {
  ledgerPath: string        // default: 'finance-ledger.md'
  exportDirectory: string   // default: 'exports'
  currency: string          // default: 'XOF'
  dateFormat: string        // default: 'YYYY-MM-DD'
}
```
