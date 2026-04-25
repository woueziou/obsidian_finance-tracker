# Obsidian Finance Tracker Plugin - Complete Development Prompt

## Project Overview

Build a **TypeScript-based Obsidian plugin** for personal finance tracking that stores data as markdown, parses it with a custom DSL, validates/transforms in-memory, and exports to CSV/JSON/SQL. The plugin must be **open-source, locally-runnable**, with **no external paid APIs or SaaS dependencies**.

**Target User**: Solo developer/freelancer in West Africa (Togo) tracking daily expenses, income, and debts with focus on geographic arbitrage and tontine management.

---

## Core Features

### 1. Data Entry
- **Expense**: date, amount, type (subscription, food, misc, utility, transport), note, location (market, store, dating, etc.)
- **Income**: date, amount, type (salary, donation, loan, investment, other), note, source
- **Debt**: amount, due date, person, note, status (open, partial, paid), interest rate (optional)

### 2. Storage
- **Primary**: Markdown ledger file (human-readable, version-controllable)
- **Secondary**: JSON cache file (for fast loading)
- **In-Memory**: DataStore (single source of truth during runtime)

### 3. UI
- Ribbon buttons for quick "Add Expense", "Add Income", "Add Debt"
- Modal dialogs for data entry with validation
- Sidebar dashboard showing monthly stats and charts
- Settings tab for currency, date format, export directory

### 4. Export/Import
- **CSV Export**: All three record types, multi-format support
- **JSON Export**: With metadata, timestamp, optional compression
- **SQL Export**: CREATE TABLE + INSERT statements (SQLite/Postgres/MySQL)
- **Import**: Reverse operations from all three formats
- **Visualization**: Charts (monthly trend, expense by type, income vs expense, debt tracker)

### 5. Analytics
- Monthly expense totals by category
- Average daily spending
- Top expense categories
- Debt payoff tracker
- Income vs expense comparison

---

## Tech Stack (Constraints)

- **Language**: TypeScript (strict mode, no `any`)
- **Framework**: Obsidian API + esbuild (pre-configured)
- **Validation**: Zod (lightweight, zero deps)
- **Parsing**: Custom regex + state machine (no parser generators)
- **Storage**: Obsidian filesystem API (Vault abstraction)
- **Visualization**: Chart.js via CDN (no npm bloat)
- **Build**: esbuild (already in sample plugin)
- **NO external services**: All processing local, no cloud LLMs, no paid APIs

---

## Project Structure

```
obsidian-finance-tracker/
├── src/
│   ├── main.ts                      # Plugin entry point, register commands/views
│   ├── types.ts                     # TypeScript interfaces: Expense, Income, Debt, Ledger
│   ├── schemas.ts                   # Zod validation schemas for each type
│   ├── parsers/
│   │   ├── expenseParser.ts         # Parse markdown expense lines → Expense objects
│   │   ├── incomeParser.ts          # Parse markdown income lines → Income objects
│   │   ├── debtParser.ts            # Parse markdown debt lines → Debt objects
│   │   └── index.ts                 # Export all parsers
│   ├── store/
│   │   ├── DataStore.ts             # In-memory cache, CRUD ops, subscriptions, aggregations
│   │   ├── MarkdownSerializer.ts    # Serialize DataStore → markdown ledger
│   │   └── FileWatcher.ts           # Watch ledger file for external changes
│   ├── commands/
│   │   ├── addExpense.ts            # Command + Modal for adding expenses
│   │   ├── addIncome.ts             # Command + Modal for adding income
│   │   ├── addDebt.ts               # Command + Modal for adding debts
│   │   └── index.ts                 # Register all commands
│   ├── views/
│   │   ├── DashboardView.ts         # Sidebar panel: real-time stats, charts
│   │   ├── LedgerView.ts            # Full ledger view with filtering
│   │   └── ChartView.ts             # Detailed charts/analytics
│   ├── export/
│   │   ├── csvExporter.ts           # Export to CSV
│   │   ├── jsonExporter.ts          # Export to JSON
│   │   ├── sqlExporter.ts           # Export to SQL
│   │   ├── csvImporter.ts           # Import from CSV
│   │   ├── jsonImporter.ts          # Import from JSON
│   │   ├── sqlImporter.ts           # Import from SQL
│   │   └── index.ts                 # Export all importers/exporters
│   └── utils/
│       ├── dateParser.ts            # Parse dates (ISO, DD/MM/YYYY, etc.)
│       ├── validators.ts            # Custom validation helpers
│       ├── formatters.ts            # Format amounts, dates for display
│       └── analytics.ts             # Calculate stats (avg daily, top categories, etc.)
├── manifest.json                    # Plugin metadata
├── package.json                     # Dependencies
├── esbuild.config.mjs               # Build config (from sample plugin)
└── README.md                        # User documentation
```

---

## Implementation Phases

### **Phase 1: Types & Validation** (Priority: CRITICAL)
1. Define `Expense`, `Income`, `Debt`, `Ledger` interfaces in `types.ts`
2. Create Zod schemas for strict validation in `schemas.ts`
3. Include: id (UUID), dates (ISO 8601), amounts (stored in cents for precision), types (enums), metadata (note, tags, location)

**Deliverable**: Type-safe foundation, passing validation tests

### **Phase 2: Parsing & DataStore** (Priority: CRITICAL)
1. Implement markdown DSL parser (regex-based state machine)
   - Format: `- [type] amount CURRENCY @ location: note` for expenses
   - Format: `- [type] amount CURRENCY from: source` for income
   - Format: `- amount, due, person, note` for debts
2. Implement `DataStore` with:
   - `addExpense(exp: Expense)`, `getExpenses()`, `getExpensesByDate()`, `getExpensesByType()`
   - Similar for incomes/debts
   - Aggregations: `getMonthlyTotal()`, `getExpenseSummaryByType()`
   - Subscriptions: `subscribe(listener)` for real-time UI updates
3. Implement `MarkdownSerializer` for bidirectional sync

**Deliverable**: Parse markdown → DataStore, serialize DataStore → markdown, round-trip tests

### **Phase 3: Plugin Core (main.ts)** (Priority: HIGH)
1. Plugin entry point registration
2. Ribbon buttons ("Add Expense", "Add Income", "Add Debt")
3. Commands (Cmd+P access)
4. Settings tab (currency, ledger path, export directory)
5. Load/save ledger on plugin load/unload

**Deliverable**: Plugin loads, buttons work, data persists

### **Phase 4: UI - Modals & Commands** (Priority: HIGH)
1. `AddExpenseCommand` + `ExpenseModal`: form inputs, date picker, type dropdown, validation
2. `AddIncomeCommand` + `IncomeModal`: same pattern
3. `AddDebtCommand` + `DebtModal`: same pattern
4. Error handling & user feedback (Notice, error modals)

**Deliverable**: Can add all three record types via UI

### **Phase 5: Views & Dashboard** (Priority: MEDIUM)
1. `DashboardView`: Sidebar panel showing
   - This month's total expenses
   - Expenses by category (pie/doughnut chart)
   - Income this month
   - Debt summary
2. Real-time updates via store subscriptions
3. Chart.js integration (CDN load)

**Deliverable**: Working dashboard with live updates

### **Phase 6: Export/Import** (Priority: MEDIUM)
1. `CSVExporter`: Multi-format (single file or separate files)
2. `JSONExporter`: With metadata, timestamps
3. `SQLExporter`: CREATE + INSERT for SQLite/Postgres/MySQL
4. Reverse importers for each format
5. UI commands: "Export as CSV", "Export as JSON", "Export as SQL"

**Deliverable**: Full round-trip export/import with no data loss

### **Phase 7: Analytics & Charts** (Priority: LOW)
1. `Analytics` utility class for complex queries
2. Monthly expense trend chart (line)
3. Expense by type chart (pie/doughnut)
4. Income vs expense comparison (bar)
5. Debt payoff tracker (progress bars)
6. Statistics: average daily spending, top categories

**Deliverable**: Full analytics page with interactive charts

### **Phase 8: Testing & Polish** (Priority: MEDIUM)
1. Unit tests for parsers, validators, exporters
2. Integration tests: markdown ↔ DataStore round-trips
3. Manual testing in Obsidian
4. Error handling & edge cases
5. User documentation & README

**Deliverable**: Reliable, well-tested plugin

---

## Markdown DSL Specification

### Expense Format
```markdown
## Expenses

### 2026-04-25
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly
- [misc] 500 XOF @ store: notebook

### 2026-04-24
- [utility] 2000 XOF: electricity bill
- [transport] 1500 XOF @ taxi: to office
```

### Income Format
```markdown
## Income

### 2026-04-25
- [salary] 150000 XOF from: April freelance work

### 2026-04-20
- [donation] 50000 XOF from: uncle's gift
```

### Debt Format
```markdown
## Debts

- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan
- amount: 50000 XOF, due: 2026-05-15, person: Ama, note: tontine contribution
```

### Frontmatter
```markdown
---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---
```

---

## Key Implementation Details

### Amount Storage
- Store amounts in **cents** (e.g., 15000 XOF = 1500000 cents)
- This avoids floating-point precision issues
- Format on display: `(cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'XOF' })`

### Date Handling
- Store all dates as ISO 8601 strings (`YYYY-MM-DD`)
- Parse user input flexibly (supports ISO, DD/MM/YYYY, MM/DD/YYYY)
- Default to today if no date provided

### IDs
- Use `crypto.randomUUID()` for expense/income/debt IDs
- Enables reliable deduplication on import

### Subscriptions
- DataStore emits changes to all registered listeners
- Views subscribe once in `onOpen()` and re-render on notification
- No need for async/await; Obsidian runs single-threaded

### File I/O
- Use `this.app.vault.read()` to read ledger file
- Use `this.app.vault.modify()` to write ledger file
- Watch file with `FileWatcher` for external changes (Git sync, mobile apps, etc.)

---

## Testing Expectations

### Unit Tests (Jest)
```typescript
// expenseParser.test.ts
describe('ExpenseParser', () => {
  it('should parse a valid expense line', () => { ... });
  it('should handle missing location', () => { ... });
  it('should reject invalid types', () => { ... });
  it('should handle multi-line notes', () => { ... });
  it('should parse different date formats', () => { ... });
});

// DataStore.test.ts
describe('DataStore', () => {
  it('should add and retrieve expenses', () => { ... });
  it('should calculate monthly totals', () => { ... });
  it('should notify listeners on changes', () => { ... });
  it('should filter by date range', () => { ... });
});

// csvExporter.test.ts
describe('CSVExporter', () => {
  it('should export expenses to CSV', () => { ... });
  it('should handle special characters in notes', () => { ... });
  it('should quote amounts correctly', () => { ... });
});
```

### Integration Tests
```typescript
// Round-trip test: markdown → parse → DataStore → serialize → markdown
it('should round-trip without data loss', () => {
  const original = readFileSync('test-ledger.md', 'utf-8');
  const parsed = parser.parse(original);
  const store = new DataStore();
  parsed.forEach(e => store.addExpense(e));
  const serialized = serializer.serialize(store);
  expect(serialized).toEqual(original);
});
```

### Manual Testing (Obsidian)
- Load plugin in Obsidian dev vault
- Add expense → verify it appears in dashboard
- Edit markdown → reload → verify data syncs
- Export to CSV/JSON/SQL → reimport → verify no data loss
- Test edge cases: large amounts, special characters, missing fields

---

## Error Handling

All operations must handle:
1. **Validation errors**: Invalid dates, negative amounts, missing required fields
2. **Parse errors**: Malformed markdown, invalid type values
3. **File I/O errors**: Vault unavailable, permission denied, file locked
4. **User feedback**: Use `new Notice()` for info/warnings/errors

Example:
```typescript
try {
  const validated = ExpenseSchema.parse(expenseData);
  this.store.addExpense(validated);
  new Notice('Expense added!');
} catch (error) {
  new Notice(`Error: ${error.message}`, 5000);
  console.error('Add expense failed:', error);
}
```

---

## Performance Considerations

1. **Lazy loading**: Load ledger file only on first use, cache in-memory
2. **Debounced saves**: Don't write to disk on every keystroke; debounce 1-2 seconds
3. **Chart rendering**: Lazy-load Chart.js only when dashboard view opens
4. **Subscription cleanup**: Unsubscribe from store when views close
5. **Large ledgers**: For 10,000+ transactions, implement pagination/filtering

---

## Security & Privacy

1. **No network requests**: All processing local
2. **No telemetry**: Don't track user data
3. **No external dependencies**: All code in repo
4. **Data format**: Markdown stays in user's vault, never leaves
5. **User control**: Respect Obsidian vault permissions

---

## Development Commands

```bash
# Initial setup
git clone https://github.com/obsidianmd/sample-plugin.git obsidian-finance-tracker
cd obsidian-finance-tracker
npm install

# Development
npm run dev          # Watch mode: esbuild auto-recompiles on save

# Testing
npm run test         # Run Jest tests
npm run type-check   # Run TypeScript compiler check

# Building
npm run build        # One-time production build

# Linting (optional)
npm run lint         # If you add eslint
```

---

## Deployment

### Manual (Personal Use)
1. `npm run build`
2. Copy `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/obsidian-finance-tracker/`
3. Reload Obsidian

### Community Plugins (Public Release)
1. Push code to GitHub
2. Add to `obsidianmd/obsidian-releases` repository
3. Users can install via Settings → Community Plugins

---

## User Documentation (README)

README should include:
- Feature overview
- Installation instructions (manual + community plugins)
- DSL format examples
- Export/import guide
- Chart descriptions
- Keyboard shortcuts
- Troubleshooting

---

## Future Extensions (Post-MVP)

1. **Budget tracking**: Set monthly limits per category
2. **Recurring expenses**: Auto-add subscriptions
3. **Forecasting**: Linear regression for debt payoff
4. **Multi-currency**: Convert amounts on export
5. **Tontine helper**: UI for group contribution tracking
6. **API webhook**: Export to Google Sheets, external DB
7. **Mobile sync**: Sync ledger across devices (requires Obsidian Sync)
8. **Plugins**: Allow third-party export/analysis plugins

---

## Code Quality Standards

1. **Strict TypeScript**: No `any`, enable strict mode
2. **Error handling**: All async operations wrapped in try/catch
3. **Logging**: Use `console.log()` for debugging, remove before release
4. **Comments**: Document complex logic, especially parsers
5. **Naming**: Descriptive variable/function names, no abbreviations
6. **Modularity**: Small functions, single responsibility
7. **Testing**: Aim for 80%+ coverage on core logic (parsers, DataStore, exporters)

---

## Git Workflow

1. Start with clean sample plugin: `git clone https://github.com/obsidianmd/sample-plugin.git`
2. Create branch: `git checkout -b feat/finance-tracker`
3. Commit by phase: one commit per completed phase
4. Push to GitHub: `git push origin feat/finance-tracker`
5. Tag releases: `git tag 0.1.0`, `git tag 0.2.0`, etc.

---

## Questions to Answer During Implementation

1. **Where should the main ledger file live?** 
   - Suggestion: Vault root as `finance-ledger.md` (configurable in settings)

2. **Should the plugin support multiple ledger files?** 
   - MVP: Single file. Future: multi-file support.

3. **How to handle concurrent edits (Obsidian Sync, Git)?** 
   - Use FileWatcher to detect external changes. Prompt user to reload.

4. **Should amounts be stored in cents or as floats?** 
   - Cents (integers). Avoids floating-point precision issues.

5. **How to format very large amounts (e.g., 1,000,000 XOF)?** 
   - Use `toLocaleString()` with currency formatting. Respect user's locale.

6. **What happens if the markdown is manually edited?** 
   - Re-parse on reload. Validate and show errors if syntax is wrong.

7. **Should the plugin support recurring expenses (subscriptions)?** 
   - MVP: Manual add each month. Future: Auto-generate from template.

---

## Success Criteria

✅ Plugin loads without errors  
✅ Can add/view all three record types (Expense, Income, Debt)  
✅ Data persists to markdown ledger file  
✅ Dashboard shows monthly totals and charts  
✅ Export to CSV, JSON, SQL works  
✅ Import from all three formats round-trips without data loss  
✅ All code is TypeScript (strict mode, no `any`)  
✅ Unit tests pass (80%+ coverage on core logic)  
✅ Manual testing in Obsidian passes  
✅ README is complete and clear  
✅ Code is documented and maintainable  

---

## Additional Notes

- **Your competitive advantage**: Locally-runnable, open-source, no cloud APIs = perfect for regulated industries (healthcare, legal, finance) in West Africa
- **Geographic arbitrage**: Market this to European/French clients (Upwork, Malt) as premium tool for tracking global expenses
- **Tontine angle**: Add special UI/analytics for group savings tracking later
- **Long-term**: This plugin becomes foundation for micro-SaaS product targeting West African markets

---

## Resources

- **Obsidian API Docs**: https://docs.obsidian.md/
- **Obsidian Sample Plugin**: https://github.com/obsidianmd/sample-plugin
- **Zod Docs**: https://zod.dev/
- **Chart.js**: https://www.chartjs.org/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## Contact & Support

If you have questions during development:
1. Check Obsidian docs: https://docs.obsidian.md/
2. Check sample plugin source code: https://github.com/obsidianmd/sample-plugin/blob/master/main.ts
3. Review Zod validation examples: https://zod.dev/
4. Test in Obsidian dev vault (never in your real vault)

---

**Ready to build? Start with Phase 1 (types & schemas), then move to Phase 2 (parsers & DataStore). Once those are solid, the rest flows naturally.**
