# Phase 8 — Testing & Polish: Implementation Plan

## Test Setup

### Install test dependencies
```bash
bun add -d jest ts-jest @types/jest
# or
npm install -D jest ts-jest @types/jest
```

### `jest.config.ts`
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/src/__tests__/__mocks__/obsidian.ts',
  },
};
```

### `src/__tests__/__mocks__/obsidian.ts`

Parsers, DataStore, and exporters do not import from `obsidian` — no mock needed for unit tests. Only if a test imports something that indirectly depends on the Obsidian API will a mock be needed.

---

## Test Files to Create

```
src/__tests__/
├── __mocks__/
│   └── obsidian.ts          # Stub for any indirect Obsidian imports
├── expenseParser.test.ts
├── incomeParser.test.ts
├── debtParser.test.ts
├── DataStore.test.ts
├── MarkdownSerializer.test.ts
├── csvExporter.test.ts
├── jsonExporter.test.ts
├── sqlExporter.test.ts
├── analytics.test.ts
├── formatters.test.ts
└── roundTrip.test.ts
```

---

## `roundTrip.test.ts` — Critical Test

```typescript
import { MarkdownSerializer } from '../store/MarkdownSerializer';
import { DataStore } from '../store/DataStore';

const SAMPLE_LEDGER = `---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---

## Expenses

### 2026-04-25
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly

### 2026-04-24
- [transport] 1500 XOF @ taxi: to office

## Income

### 2026-04-25
- [salary] 150000 XOF from: April freelance work

## Debts

- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan
- amount: 50000 XOF, due: 2026-05-15, person: Ama, note: tontine, status: partial`;

describe('Round-trip', () => {
  it('preserves all expense fields', () => {
    const { ledger } = MarkdownSerializer.deserialize(SAMPLE_LEDGER);
    const store = new DataStore();
    store.load(ledger);

    const serialized = MarkdownSerializer.serialize(store, ledger.meta);
    const { ledger: reparsed } = MarkdownSerializer.deserialize(serialized);

    expect(reparsed.expenses.length).toBe(ledger.expenses.length);
    // Compare field-by-field (id excluded — regenerated)
    reparsed.expenses.forEach((e, i) => {
      expect(e.amount).toBe(ledger.expenses[i].amount);
      expect(e.date).toBe(ledger.expenses[i].date);
      expect(e.type).toBe(ledger.expenses[i].type);
      expect(e.note).toBe(ledger.expenses[i].note);
      expect(e.location).toBe(ledger.expenses[i].location);
    });
  });

  it('preserves all debt fields including optional status', () => { ... });
  it('preserves all income fields', () => { ... });
  it('produces identical output on second serialize (idempotent)', () => {
    const { ledger } = MarkdownSerializer.deserialize(SAMPLE_LEDGER);
    const store = new DataStore();
    store.load(ledger);
    const s1 = MarkdownSerializer.serialize(store, ledger.meta);
    const { ledger: l2 } = MarkdownSerializer.deserialize(s1);
    store.load(l2);
    const s2 = MarkdownSerializer.serialize(store, l2.meta);
    expect(s1).toBe(s2);
  });
});
```

---

## TypeScript Audit

Run:
```bash
npx tsc --noEmit --strict 2>&1 | grep -c 'error'
# Must output: 0
```

Also check:
```bash
grep -rn ': any' src/ --include='*.ts'
grep -rn 'as any' src/ --include='*.ts'
grep -rn 'console\.log' src/ --include='*.ts'
# All three must return empty
```

---

## Debug Cleanup

Search for and remove:
- `console.log(...)` — remove or replace with `console.warn('[Finance Tracker] ...')` for legitimate warnings
- Commented-out code blocks
- TODO comments that can be resolved

Keep:
- `console.warn('[Finance Tracker] ...')` for non-fatal issues (e.g., Chart.js failed to load)
- `console.error('[Finance Tracker] ...')` in catch blocks

---

## README Sections

```markdown
# Finance Tracker (Obsidian Plugin)

## Features
## Installation (Manual)
## Installation (Community Plugins — when listed)
## Quick Start
## Markdown DSL Reference
  - Expense format
  - Income format
  - Debt format
  - Frontmatter
## Settings
  - Ledger path
  - Export directory
  - Default currency
## Export & Import
  - CSV export
  - JSON export
  - SQL export
  - Importing data
## Keyboard Shortcuts
## Troubleshooting
  - "Ledger loaded with N parse errors"
  - Chart not showing
  - File not found
## Development
  - Setup
  - Build
  - Testing
## License
```

---

## Final Manual Test Pass Sequence

Run this exact sequence in a clean Obsidian dev vault:

1. Enable plugin → verify `finance-ledger.md` created
2. Add 3 expenses → verify in ledger file
3. Add 1 income → verify
4. Add 1 debt → verify
5. Open dashboard → verify totals correct
6. Export CSV → open in spreadsheet → verify correct
7. Export JSON → verify valid JSON → reimport → verify "3 skipped" (or correct count)
8. Export SQL → run `sqlite3 :memory: < export.sql` → verify no errors
9. Edit ledger file manually → verify FileWatcher prompt appears
10. Reload → verify all records still present
11. Change settings → restart → verify settings persisted
12. Disable plugin → no errors in console
