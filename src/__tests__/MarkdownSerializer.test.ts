import { describe, it, expect } from 'bun:test';
import { MarkdownSerializer } from '../store/MarkdownSerializer.ts';
import { DataStore } from '../store/DataStore.ts';

const VALID_LEDGER = `---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---

## Expenses

### 2026-04-25
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly

## Income

### 2026-04-25
- [salary] 150000 XOF from: April freelance work

## Debts

- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan`;

describe('MarkdownSerializer.deserialize', () => {
  it('returns zero errors and correct records for valid ledger', () => {
    const { ledger, errors } = MarkdownSerializer.deserialize(VALID_LEDGER);
    expect(errors).toHaveLength(0);
    expect(ledger.expenses).toHaveLength(2);
    expect(ledger.incomes).toHaveLength(1);
    expect(ledger.debts).toHaveLength(1);
  });

  it('returns empty ledger and zero errors for empty string', () => {
    const { ledger, errors } = MarkdownSerializer.deserialize('');
    expect(errors).toHaveLength(0);
    expect(ledger.expenses).toHaveLength(0);
    expect(ledger.incomes).toHaveLength(0);
    expect(ledger.debts).toHaveLength(0);
  });

  it('returns empty incomes and no error when Income section is missing', () => {
    const content = `---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---

## Expenses

### 2026-04-25
- [food] 5000 XOF: lunch

## Debts

- amount: 10000 XOF, due: 2026-12-01, person: Ali, note: test`;
    const { ledger, errors } = MarkdownSerializer.deserialize(content);
    expect(ledger.incomes).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(ledger.expenses).toHaveLength(1);
  });
});

describe('MarkdownSerializer.serialize', () => {
  it('output contains ## Expenses section', () => {
    const store = new DataStore();
    store.addExpense({
      date: '2026-04-25',
      amount: 1500000,
      currency: 'XOF',
      type: 'food',
      note: 'lunch',
    });
    const meta = { title: 'Finance Ledger', currency: 'XOF', updated: '2026-04-25' };
    const result = MarkdownSerializer.serialize(store, meta);
    expect(result).toContain('## Expenses');
  });

  it('dates sorted descending in expenses', () => {
    const store = new DataStore();
    store.addExpense({ date: '2026-04-23', amount: 100, currency: 'XOF', type: 'misc', note: 'a' });
    store.addExpense({ date: '2026-04-25', amount: 200, currency: 'XOF', type: 'misc', note: 'b' });
    const meta = { title: 'Finance Ledger', currency: 'XOF', updated: '2026-04-25' };
    const result = MarkdownSerializer.serialize(store, meta);
    const idx25 = result.indexOf('### 2026-04-25');
    const idx23 = result.indexOf('### 2026-04-23');
    expect(idx25).toBeLessThan(idx23);
  });

  it('debts sorted ascending by dueDate', () => {
    const store = new DataStore();
    store.addDebt({ amount: 100, currency: 'XOF', dueDate: '2026-12-31', person: 'A', note: 'late', status: 'open' });
    store.addDebt({ amount: 200, currency: 'XOF', dueDate: '2026-06-01', person: 'B', note: 'soon', status: 'open' });
    const meta = { title: 'Finance Ledger', currency: 'XOF', updated: '2026-04-25' };
    const result = MarkdownSerializer.serialize(store, meta);
    const idxJune = result.indexOf('2026-06-01');
    const idxDec  = result.indexOf('2026-12-31');
    expect(idxJune).toBeLessThan(idxDec);
  });

  it('no trailing whitespace on any line', () => {
    const store = new DataStore();
    store.addExpense({ date: '2026-04-25', amount: 1000, currency: 'XOF', type: 'food', note: 'test' });
    const meta = { title: 'Finance Ledger', currency: 'XOF', updated: '2026-04-25' };
    const result = MarkdownSerializer.serialize(store, meta);
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line).toBe(line.trimEnd());
    }
  });

  it('calling serialize twice produces identical strings', () => {
    const store = new DataStore();
    store.addExpense({ date: '2026-04-25', amount: 1000, currency: 'XOF', type: 'food', note: 'test' });
    const meta = { title: 'Finance Ledger', currency: 'XOF', updated: '2026-04-25' };
    const result1 = MarkdownSerializer.serialize(store, meta);
    const result2 = MarkdownSerializer.serialize(store, meta);
    expect(result1).toBe(result2);
  });
});