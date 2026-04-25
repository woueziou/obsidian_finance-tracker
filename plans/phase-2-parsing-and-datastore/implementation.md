# Phase 2 — Parsing & DataStore: Implementation Plan

## Parser Architecture

Each parser is a **pure function** — no class, no side effects:

```typescript
// expenseParser.ts
export function parseExpenses(
  lines: string[],
  startIndex: number,  // index of "## Expenses" line
): { expenses: Expense[]; errors: ParseError[] }
```

`MarkdownSerializer.deserialize()` splits the file into lines, locates section headers, and dispatches to each parser with the relevant line slice.

---

## Step 1 — `expenseParser.ts`

### Regex patterns

```typescript
const DATE_HEADING  = /^### (\d{4}-\d{2}-\d{2})$/;
const EXPENSE_LINE  = /^- \[(\w+)\] (\d+) ([A-Z]{3})(?: @ ([^:]+))?: (.+)$/;
//                        type  amount  currency  location(opt)  note
```

### Logic

```
currentDate = null
for each line:
  if line matches DATE_HEADING  → currentDate = match[1]
  if line matches EXPENSE_LINE:
    if currentDate is null → push ParseError('expense line before date heading')
    else:
      type = match[1]
      if type not in ExpenseType values → push ParseError; continue
      amount = parseInt(match[2]) * 100
      currency = match[3]
      location = match[4]?.trim() or undefined
      note = match[5].trim()
      push Expense object (id assigned later by DataStore)
  if line matches /^## / and not the expense heading → stop (new section)
```

### ID assignment

Parsers do not assign IDs. They return records without `id`. `DataStore.load()` assigns `crypto.randomUUID()` to each during bulk load.

---

## Step 2 — `incomeParser.ts`

### Regex pattern

```typescript
const INCOME_LINE = /^- \[(\w+)\] (\d+) ([A-Z]{3}) from: (.+)$/;
//                      type  amount  currency  source
```

Same date-heading logic as expense parser.

---

## Step 3 — `debtParser.ts`

### Regex pattern

```typescript
const DEBT_LINE = /^- amount: (\d+) ([A-Z]{3}), due: (\d{4}-\d{2}-\d{2}), person: ([^,]+), note: ([^,]+)(?:, status: (open|partial|paid))?(?:, rate: (\d+(?:\.\d+)?))?$/;
```

Debt lines do not use date headings — they live flat under `## Debts`.

---

## Step 4 — `MarkdownSerializer.ts`

### `deserialize(content: string): ParseResult`

```
1. Parse frontmatter (between --- delimiters)
2. Split remaining content into lines
3. Locate section header indices
4. Call expenseParser, incomeParser, debtParser with their respective line slices
5. Assign UUIDs to all parsed records
6. Return { ledger: { expenses, incomes, debts, meta }, errors }
```

### `serialize(store: DataStore, meta: LedgerMeta): string`

```
1. Build frontmatter block
2. Build ## Expenses section:
   - Group expenses by date (Map<string, Expense[]>)
   - Sort dates descending
   - For each date: write ### heading, then one line per expense
3. Build ## Income section (same pattern)
4. Build ## Debts section:
   - Sort debts by dueDate ascending
   - One line per debt
5. Join all sections with \n\n separator
```

Output must be deterministic: same input → same bytes.

---

## Step 5 — `DataStore.ts`

```typescript
class DataStore {
  private expenses: Map<string, Expense> = new Map();
  private incomes:  Map<string, Income>  = new Map();
  private debts:    Map<string, Debt>    = new Map();
  private listeners: Set<() => void>     = new Set();

  load(ledger: Ledger): void {
    this.expenses.clear();
    this.incomes.clear();
    this.debts.clear();
    ledger.expenses.forEach(e => this.expenses.set(e.id, e));
    ledger.incomes.forEach(i  => this.incomes.set(i.id, i));
    ledger.debts.forEach(d    => this.debts.set(d.id, d));
    this.notify();
  }

  addExpense(input: ExpenseInput): Expense {
    const record = { ...input, id: crypto.randomUUID() };
    ExpenseSchema.parse(record); // validate
    this.expenses.set(record.id, record);
    this.notify();
    return record;
  }

  // ... similar for Income and Debt

  getMonthlyExpenseTotal(year: number, month: number): number {
    return [...this.expenses.values()]
      .filter(e => e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }
}
```

Use `Map` (not array) for O(1) lookup by ID.

---

## Step 6 — `FileWatcher.ts`

```typescript
class FileWatcher {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private vault: Vault,
    private ledgerPath: string,
    private isWriting: () => boolean,  // flag from main plugin
    private onExternalChange: () => void,
  ) {
    this.vault.on('modify', (file) => {
      if (file.path !== this.ledgerPath) return;
      if (this.isWriting()) return; // plugin's own write — ignore
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(this.onExternalChange, 500);
    });
  }
}
```

The `isWriting` callback prevents the plugin's own `vault.modify()` call from triggering a spurious reload prompt.

---

## Serialization Format (canonical)

### Expense line
```
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly
```

Rules:
- `location` only present if non-empty
- `@ ` separator before location, `: ` separator before note
- Amount is `cents / 100` as integer string — no decimals

### Income line
```
- [salary] 150000 XOF from: April freelance work
```

### Debt line
```
- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan
- amount: 50000 XOF, due: 2026-05-15, person: Ama, note: tontine, status: partial
- amount: 200000 XOF, due: 2026-12-31, person: Bank, note: equipment, status: open, rate: 5.0
```

Rules:
- `status` omitted if value is `'open'` and not explicitly set (reduces noise)
- `rate` omitted if undefined
