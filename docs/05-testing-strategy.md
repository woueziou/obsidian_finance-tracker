# Testing Strategy

## Tooling

- **Test runner**: Jest (via `ts-jest` or `bun test`)
- **Location**: `src/__tests__/`
- **Coverage target**: 80%+ on parsers, DataStore, and exporters
- **No Obsidian API mocks needed** for pure logic (parsers, DataStore, exporters are all pure or injectable)

---

## Unit Tests

### `expenseParser.test.ts`

```typescript
describe('ExpenseParser', () => {
  it('parses a valid expense line with location')
  it('parses a valid expense line without location')
  it('rejects an unknown expense type')
  it('returns ParseError for missing note')
  it('handles note with colons inside the text')
  it('parses multiple expenses under a date heading')
  it('assigns date from parent heading')
  it('handles blank lines between entries')
  it('skips non-list lines inside expense section')
})
```

### `incomeParser.test.ts`

```typescript
describe('IncomeParser', () => {
  it('parses a valid income line')
  it('rejects unknown income type')
  it('parses source text with spaces and punctuation')
  it('assigns correct date from heading')
})
```

### `debtParser.test.ts`

```typescript
describe('DebtParser', () => {
  it('parses a debt with all fields')
  it('parses a debt with optional status and rate')
  it('defaults status to "open" when omitted')
  it('rejects debt with missing person field')
  it('rejects debt with invalid due date format')
  it('parses interest rate as float')
})
```

### `DataStore.test.ts`

```typescript
describe('DataStore', () => {
  it('stores and retrieves an expense')
  it('stores and retrieves income')
  it('stores and retrieves a debt')
  it('getExpensesByDate returns only matching date')
  it('getExpensesByType returns only matching type')
  it('getMonthlyExpenseTotal sums cents correctly')
  it('getExpenseSummaryByType groups by type')
  it('notifies subscribers on addExpense')
  it('notifies subscribers on deleteExpense')
  it('unsubscribe stops notifications')
  it('updateExpense modifies in place')
  it('deleteExpense removes record')
  it('handles empty store gracefully')
})
```

### `csvExporter.test.ts`

```typescript
describe('CSVExporter', () => {
  it('exports expenses with correct headers')
  it('quotes notes containing commas')
  it('quotes notes containing double quotes (escape as "")')
  it('outputs amounts in cents')
  it('handles empty expense list')
  it('exports all three types to separate sheets')
})
```

### `jsonExporter.test.ts`

```typescript
describe('JSONExporter', () => {
  it('includes metadata in export')
  it('exports correct structure')
  it('amounts are integers in export')
  it('round-trips without data loss')
})
```

### `sqlExporter.test.ts`

```typescript
describe('SQLExporter', () => {
  it('generates CREATE TABLE for expenses')
  it('generates INSERT statements')
  it('escapes single quotes in note text')
  it('generates postgres-compatible SQL with dialect flag')
  it('generates sqlite-compatible SQL by default')
})
```

### `formatters.test.ts`

```typescript
describe('formatAmount', () => {
  it('formats XOF correctly')
  it('formats USD with 2 decimals')
  it('handles zero')
  it('handles large amounts without overflow')
})

describe('formatDate', () => {
  it('formats ISO date for display')
  it('returns empty string for undefined')
})
```

### `dateParser.test.ts`

```typescript
describe('parseDate', () => {
  it('parses ISO 8601: 2026-04-25')
  it('parses DD/MM/YYYY: 25/04/2026')
  it('parses MM/DD/YYYY: 04/25/2026')
  it('returns today for empty input')
  it('throws for unrecognized format')
})
```

---

## Integration Tests

### `roundTrip.test.ts`

```typescript
it('expense round-trip: markdown → parse → serialize → markdown', () => {
  const original = `## Expenses\n\n### 2026-04-25\n- [food] 15000 XOF @ market: rice and vegetables\n`;
  const result = MarkdownSerializer.deserialize(original);
  const store = new DataStore();
  result.ledger.expenses.forEach(e => store.addExpense(e));
  const serialized = MarkdownSerializer.serialize(store, result.ledger.meta);
  // Normalize: strip IDs (not in markdown), compare expense lines
  expect(extractExpenseLines(serialized)).toEqual(extractExpenseLines(original));
});

it('debt round-trip: markdown → parse → serialize → markdown')
it('income round-trip: markdown → parse → serialize → markdown')
it('full ledger round-trip preserves all three sections')
```

### `importExport.test.ts`

```typescript
it('CSV export → import restores all expenses')
it('JSON export → import restores all records with correct amounts')
it('SQL export produces valid SQLite syntax')
it('import skips duplicate IDs')
```

---

## Manual Testing Checklist (Obsidian)

Run these against a dev vault before any release:

- [ ] Plugin loads without errors (check dev console)
- [ ] Add expense via ribbon button — appears in ledger file
- [ ] Add income via ribbon button — appears in ledger file
- [ ] Add debt via ribbon button — appears in ledger file
- [ ] Edit ledger file externally — FileWatcher prompts reload
- [ ] Dashboard opens — shows correct month totals
- [ ] Dashboard updates immediately after adding a record
- [ ] Export CSV — file created in export directory
- [ ] Export JSON — valid JSON, opens cleanly
- [ ] Export SQL — valid SQLite syntax (test with `sqlite3 < export.sql`)
- [ ] Import CSV — records appear, no duplicates on second import
- [ ] Settings change (ledger path) — plugin uses new path after save
- [ ] Plugin unloads cleanly — no errors in console
