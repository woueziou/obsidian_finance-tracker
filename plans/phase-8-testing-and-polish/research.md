# Phase 8 — Testing & Polish: Research

## Jest + ts-jest Setup

```bash
bun add -d jest ts-jest @types/jest
```

`jest.config.ts`:
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.ts'],
};
```

`package.json` scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit --strict"
  }
}
```

---

## Alternative: Bun Test

If the project uses Bun, `bun test` works without Jest:

```typescript
// bun test syntax
import { describe, it, expect } from 'bun:test';
```

`bun test` runs faster than Jest and requires zero config. The downside: fewer ecosystem integrations. Either works for this project — choose based on what's already in `package.json`.

---

## Mocking Obsidian API

Pure logic modules (parsers, DataStore, analytics, exporters) don't import from `obsidian`. If any file transitively imports Obsidian, create a minimal mock:

```typescript
// src/__tests__/__mocks__/obsidian.ts
export class Plugin {}
export class Modal { app: unknown; contentEl = document.createElement('div'); onOpen() {} onClose() {} close() {} }
export class Notice { constructor(message: string, timeout?: number) {} }
export class ItemView {}
export class PluginSettingTab {}
export class Setting { setName() { return this; } setDesc() { return this; } addText() { return this; } addButton() { return this; } addDropdown() { return this; } }
```

Register in `jest.config.ts`:
```typescript
moduleNameMapper: {
  '^obsidian$': '<rootDir>/src/__tests__/__mocks__/obsidian.ts',
}
```

---

## Code Coverage Goals

Target: **80%+ statement coverage** on these files:
- `src/parsers/expenseParser.ts`
- `src/parsers/incomeParser.ts`
- `src/parsers/debtParser.ts`
- `src/store/DataStore.ts`
- `src/export/csvExporter.ts`
- `src/export/jsonExporter.ts`
- `src/utils/analytics.ts`
- `src/utils/formatters.ts`

View coverage:
```bash
npx jest --coverage
# or
bun test --coverage
```

Files excluded from coverage target (require Obsidian API or are UI-only):
- `src/main.ts`
- `src/views/*.ts`
- `src/commands/*.ts`
- `src/store/FileWatcher.ts`

---

## Test Data Helpers

Create reusable test fixtures to avoid repetition:

```typescript
// src/__tests__/fixtures.ts
import type { Expense, Income, Debt } from '../types';

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'test-uuid-' + Math.random().toString(36).slice(2),
    date: '2026-04-25',
    amount: 1500000,
    currency: 'XOF',
    type: 'food',
    note: 'test expense',
    ...overrides,
  };
}

export function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: 'test-uuid-' + Math.random().toString(36).slice(2),
    date: '2026-04-25',
    amount: 15000000,
    currency: 'XOF',
    type: 'salary',
    note: 'test income',
    source: 'client',
    ...overrides,
  };
}
```

---

## What to Test vs What Not to Test

**Test (pure logic, deterministic):**
- All parser functions
- DataStore CRUD and aggregations
- DataStore pub/sub
- All exporter output strings
- Analytics calculations
- Formatters

**Don't test (requires Obsidian runtime, tested manually):**
- Modal UI rendering
- Ribbon button callbacks
- File I/O (`vault.read`, `vault.modify`)
- Chart.js rendering
- Settings tab UI

---

## Common Test Patterns

### Testing that a function throws
```typescript
expect(() => ExpenseSchema.parse(badData)).toThrow();
```

### Testing async DataStore methods
DataStore is synchronous — no `await` needed in tests.

### Testing parse errors
```typescript
const { expenses, errors } = parseExpenses(lines);
expect(errors).toHaveLength(1);
expect(errors[0].message).toContain('unknown type');
```

### Testing subscriptions
```typescript
const store = new DataStore();
const listener = jest.fn();
const unsub = store.subscribe(listener);
store.addExpense(makeExpense());
expect(listener).toHaveBeenCalledTimes(1);
unsub();
store.addExpense(makeExpense());
expect(listener).toHaveBeenCalledTimes(1); // still 1 after unsub
```

---

## README: Installation Instructions

```markdown
## Installation (Manual)

1. Run `npm run build` (or `bun run build`)
2. Copy `main.js`, `manifest.json`, and `styles.css` to:
   `.obsidian/plugins/obsidian-finance-tracker/`
3. Open Obsidian → Settings → Community Plugins → enable "Finance Tracker"
4. The plugin creates `finance-ledger.md` in your vault root on first load
```
