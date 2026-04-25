# Execution Phases

## Phase 1 — Types & Validation (CRITICAL)

**Goal**: Establish the type-safe foundation everything else builds on.

**Files to create**:
- `src/types.ts` — TypeScript interfaces
- `src/schemas.ts` — Zod validation schemas

**Deliverables**:
- `Expense`, `Income`, `Debt`, `Ledger` interfaces fully typed
- Zod schemas matching each interface — validate on parse and on user input
- Enum types for `ExpenseType`, `IncomeType`, `DebtStatus`
- Amount stored as `number` (cents, integer), validated as non-negative integer
- Date stored as `string` (ISO 8601), validated via regex or `z.string().date()`

**Done when**: TypeScript compiles with `strict: true`, no `any`, schemas reject invalid data in tests.

---

## Phase 2 — Parsing & DataStore (CRITICAL)

**Goal**: Parse markdown → typed objects; serialize typed objects → markdown; store in-memory.

**Files to create**:
- `src/parsers/expenseParser.ts`
- `src/parsers/incomeParser.ts`
- `src/parsers/debtParser.ts`
- `src/parsers/index.ts`
- `src/store/DataStore.ts`
- `src/store/MarkdownSerializer.ts`
- `src/store/FileWatcher.ts`

**Key implementation points**:

*Parsers*
- State machine: scan lines top-to-bottom, track current section (`## Expenses`, `## Income`, `## Debts`) and current date heading (`### YYYY-MM-DD`)
- Each parser is a pure function: `string → Result<RecordType[], ParseError[]>`
- Collect all errors; never throw mid-parse

*DataStore*
- Singleton per plugin instance
- CRUD: `add*`, `get*`, `update*`, `delete*` for each record type
- Aggregations: `getMonthlyTotal(year, month)`, `getExpenseSummaryByType(year, month)`, `getDebtSummary()`
- Subscriptions: `subscribe(listener: () => void): () => void` returns unsubscribe fn

*MarkdownSerializer*
- `serialize(store: DataStore): string` — produce canonical markdown
- `deserialize(content: string): ParseResult` — parse file into records

*FileWatcher*
- Use Obsidian `vault.on('modify', ...)` to detect external changes
- Debounce reload prompt by 500 ms

**Done when**: round-trip test passes — `markdown → parse → DataStore → serialize → markdown` produces identical output.

---

## Phase 3 — Plugin Core (HIGH)

**Goal**: Plugin loads in Obsidian, ribbon buttons exist, settings persist.

**Files to create/modify**:
- `src/main.ts` — full plugin entry point
- Plugin settings interface + settings tab

**Key implementation points**:
- `onload()`: read ledger file → parse → populate DataStore
- `onunload()`: flush pending writes, close views, remove event listeners
- Ribbon buttons: "Add Expense" (💰), "Add Income" (📥), "Add Debt" (📋)
- Command palette entries for all three
- Settings tab: ledger file path, export directory, default currency, date format
- Settings persisted via `this.loadData()` / `this.saveData()`

**Done when**: plugin loads/unloads without errors, buttons open placeholder modals, settings save.

---

## Phase 4 — UI Modals & Commands (HIGH)

**Goal**: User can add all three record types through validated form dialogs.

**Files to create**:
- `src/commands/addExpense.ts` — `AddExpenseModal`
- `src/commands/addIncome.ts` — `AddIncomeModal`
- `src/commands/addDebt.ts` — `AddDebtModal`
- `src/commands/index.ts`

**Each modal**:
- Extends Obsidian `Modal`
- Fields: all required + optional per record type
- Client-side validation via Zod before submit
- On success: `store.add*()` → trigger debounced write → `new Notice('...')`
- On error: inline field errors + `new Notice('Error: ...')`
- Date field defaults to today

**Done when**: user can add expense/income/debt, see it in the ledger file, no TypeScript errors.

---

## Phase 5 — Dashboard View (MEDIUM)

**Goal**: Sidebar panel showing live monthly stats and charts.

**Files to create**:
- `src/views/DashboardView.ts` — `ItemView` subclass
- `src/views/LedgerView.ts` — table view with filtering
- `src/views/ChartView.ts` — Chart.js integration

**Dashboard panels**:
- This month's total expenses (formatted amount)
- Expense breakdown by category (doughnut chart)
- Income this month
- Open debts count + total
- Quick "Add" buttons

**Chart.js integration**:
- Load from CDN only when view opens (`createEl('script', { src: ... })`)
- Destroy chart instances on view close to avoid memory leaks

**Subscriptions**:
- `onOpen()`: subscribe to DataStore, render
- `onClose()`: call unsubscribe fn

**Done when**: dashboard opens, shows correct month data, updates immediately after adding a record.

---

## Phase 6 — Export / Import (MEDIUM)

**Goal**: Full round-trip export/import with no data loss for CSV, JSON, SQL.

**Files to create**:
- `src/export/csvExporter.ts` + `src/export/csvImporter.ts`
- `src/export/jsonExporter.ts` + `src/export/jsonImporter.ts`
- `src/export/sqlExporter.ts` + `src/export/sqlImporter.ts`
- `src/export/index.ts`

**CSV**:
- One sheet per record type, or combined with `type` column
- Quote all string fields; escape embedded commas/quotes

**JSON**:
- `{ meta: { exportedAt, currency, version }, expenses: [...], incomes: [...], debts: [...] }`
- Amounts in cents in JSON; human-readable `amountFormatted` field alongside

**SQL**:
- `CREATE TABLE IF NOT EXISTS` for each type
- `INSERT OR REPLACE INTO` with all columns
- Dialect flag: `sqlite` (default) | `postgres` | `mysql`

**Import**:
- Detect format automatically by file extension
- Skip records that already exist by ID (deduplication)
- Report import summary via Notice

**Done when**: export → modify DataStore → import restores original state exactly.

---

## Phase 7 — Analytics (LOW)

**Goal**: Interactive charts and statistics page.

**Files to create**:
- `src/utils/analytics.ts`

**Metrics**:
- Average daily spending (current month)
- Top 3 expense categories by amount
- Month-over-month expense trend (last 6 months, line chart)
- Income vs expense bar chart (last 6 months)
- Debt payoff progress bars per person

**Done when**: analytics view renders all charts with real data.

---

## Phase 8 — Testing & Polish (MEDIUM)

**Goal**: Reliable, well-tested plugin ready for personal use.

**Files to create**:
- `src/__tests__/expenseParser.test.ts`
- `src/__tests__/DataStore.test.ts`
- `src/__tests__/csvExporter.test.ts`
- `src/__tests__/roundTrip.test.ts`

**Test targets**:
- Parser: valid lines, missing fields, invalid type, multi-line notes, date formats
- DataStore: CRUD, aggregations, subscriptions, date filtering
- Exporters: special characters, large amounts, empty datasets
- Round-trip: markdown → parse → serialize → markdown equality

**Polish checklist**:
- Remove all `console.log` debug statements
- Verify TypeScript strict mode — zero errors
- Write/update README with DSL examples, install steps, keyboard shortcuts

**Done when**: `npm test` passes, `npm run type-check` clean, README complete.
