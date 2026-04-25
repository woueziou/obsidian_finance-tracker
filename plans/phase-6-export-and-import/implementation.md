# Phase 6 — Export & Import: Implementation Plan

## CSV Exporter

### `csvField(value: string | number | undefined): string`

```typescript
function csvField(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
```

### `expensesToCsv(expenses: Expense[]): string`

```typescript
const EXPENSE_HEADERS = ['id', 'date', 'amount', 'currency', 'type', 'note', 'location'];

function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map(e => [
    e.id, e.date, e.amount, e.currency, e.type, e.note, e.location ?? '',
  ].map(csvField).join(','));
  return [EXPENSE_HEADERS.join(','), ...rows].join('\n');
}
```

Amount exported as **cents** (raw integer). Import reads it back directly. Add `amountDisplay` column (human-readable) alongside for convenience in Excel.

### Full export (all types to one file)

```typescript
export function exportAllToCsv(store: DataStore, currency: string): string {
  const sections = [
    '# EXPENSES',
    expensesToCsv(store.getExpenses()),
    '',
    '# INCOMES',
    incomesToCsv(store.getIncomes()),
    '',
    '# DEBTS',
    debtsToCsv(store.getDebts()),
  ];
  return sections.join('\n');
}
```

---

## CSV Importer

```typescript
export function importCsv(content: string, store: DataStore): { added: number; skipped: number } {
  const sections = parseCsvSections(content); // split by '# EXPENSES' / '# INCOMES' / '# DEBTS'
  let added = 0, skipped = 0;

  for (const row of sections.expenses) {
    if (store.getExpenseById(row.id)) { skipped++; continue; }
    const result = ExpenseSchema.safeParse(row);
    if (result.success) { store.addExpenseWithId(result.data); added++; }
    else skipped++;
  }
  // same for incomes and debts
  return { added, skipped };
}
```

`addExpenseWithId(expense: Expense)` — a DataStore method that inserts with the provided `id` (used by importers only, not by modals).

---

## JSON Exporter

```typescript
interface JsonExport {
  meta: {
    exportedAt: string;  // ISO 8601 datetime
    version: '1.0';
    currency: string;
  };
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
}

export function exportToJson(store: DataStore, currency: string): string {
  const payload: JsonExport = {
    meta: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      currency,
    },
    expenses: store.getExpenses(),
    incomes:  store.getIncomes(),
    debts:    store.getDebts(),
  };
  return JSON.stringify(payload, null, 2);
}
```

Amounts stored as integers (cents) in JSON — same as DataStore.

## JSON Importer

```typescript
export function importFromJson(content: string, store: DataStore): { added: number; skipped: number } {
  const payload = JSON.parse(content) as JsonExport;
  // Validate structure
  let added = 0, skipped = 0;

  for (const e of payload.expenses ?? []) {
    if (store.getExpenseById(e.id)) { skipped++; continue; }
    const r = ExpenseSchema.safeParse(e);
    if (r.success) { store.addExpenseWithId(r.data); added++; }
    else skipped++;
  }
  // same for incomes and debts
  return { added, skipped };
}
```

---

## SQL Exporter

### Helper

```typescript
function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
```

### `exportToSql(store: DataStore, dialect: 'sqlite' | 'postgres' | 'mysql'): string`

```typescript
const AUTO_INCREMENT = dialect === 'mysql' ? 'AUTO_INCREMENT' : '';
const INTEGER_PK = dialect === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

statements.push(`CREATE TABLE IF NOT EXISTS expenses (
  id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  note TEXT NOT NULL,
  location TEXT
);`);

for (const e of store.getExpenses()) {
  statements.push(
    `INSERT OR REPLACE INTO expenses (id, date, amount, currency, type, note, location) VALUES (${sqlStr(e.id)}, ${sqlStr(e.date)}, ${e.amount}, ${sqlStr(e.currency)}, ${sqlStr(e.type)}, ${sqlStr(e.note)}, ${e.location ? sqlStr(e.location) : 'NULL'});`
  );
}
```

For Postgres, use `INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...`.

---

## Export Commands in `main.ts`

```typescript
this.addCommand({
  id: 'export-csv',
  name: 'Export as CSV',
  callback: async () => {
    const content = exportAllToCsv(this.store, this.settings.currency);
    const path = `${this.settings.exportDirectory}/finance-${today()}.csv`;
    await this.ensureExportDir();
    await this.app.vault.create(path, content);
    new Notice(`Exported to ${path}`);
  }
});
// Same pattern for JSON and SQL
```

---

## `ensureExportDir()` helper

```typescript
private async ensureExportDir(): Promise<void> {
  const dir = this.settings.exportDirectory;
  const exists = this.app.vault.getFolderByPath(dir);
  if (!exists) await this.app.vault.createFolder(dir);
}
```
