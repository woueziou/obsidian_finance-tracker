import { describe, it, expect } from 'bun:test';
import { MarkdownSerializer } from '../store/MarkdownSerializer.ts';
import { DataStore } from '../store/DataStore.ts';

const ORIGINAL = `---
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

describe('Round-trip integration test', () => {
  it('expense fields survive deserialize → serialize → deserialize', () => {
    const { ledger } = MarkdownSerializer.deserialize(ORIGINAL);
    const store = new DataStore();
    store.load(ledger);
    const serialized = MarkdownSerializer.serialize(store, ledger.meta);
    const { ledger: reparsed, errors } = MarkdownSerializer.deserialize(serialized);

    expect(errors).toHaveLength(0);
    expect(reparsed.expenses).toHaveLength(ledger.expenses.length);

    // Sort both by amount for stable comparison (ids differ after re-parse)
    const orig = [...ledger.expenses].sort((a, b) => a.amount - b.amount);
    const re   = [...reparsed.expenses].sort((a, b) => a.amount - b.amount);

    for (let i = 0; i < orig.length; i++) {
      const o = orig[i]!;
      const r = re[i]!;
      expect(r.date).toBe(o.date);
      expect(r.amount).toBe(o.amount);
      expect(r.type).toBe(o.type);
      expect(r.note).toBe(o.note);
      expect(r.location).toBe(o.location);
      expect(r.currency).toBe(o.currency);
    }
  });

  it('income fields survive round-trip', () => {
    const { ledger } = MarkdownSerializer.deserialize(ORIGINAL);
    const store = new DataStore();
    store.load(ledger);
    const serialized = MarkdownSerializer.serialize(store, ledger.meta);
    const { ledger: reparsed } = MarkdownSerializer.deserialize(serialized);

    expect(reparsed.incomes).toHaveLength(ledger.incomes.length);
    const orig = [...ledger.incomes].sort((a, b) => a.amount - b.amount);
    const re   = [...reparsed.incomes].sort((a, b) => a.amount - b.amount);

    for (let i = 0; i < orig.length; i++) {
      const o = orig[i]!;
      const r = re[i]!;
      expect(r.date).toBe(o.date);
      expect(r.amount).toBe(o.amount);
      expect(r.type).toBe(o.type);
      expect(r.source).toBe(o.source);
      expect(r.currency).toBe(o.currency);
    }
  });

  it('debt fields survive round-trip', () => {
    const { ledger } = MarkdownSerializer.deserialize(ORIGINAL);
    const store = new DataStore();
    store.load(ledger);
    const serialized = MarkdownSerializer.serialize(store, ledger.meta);
    const { ledger: reparsed } = MarkdownSerializer.deserialize(serialized);

    expect(reparsed.debts).toHaveLength(ledger.debts.length);
    const orig = [...ledger.debts].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const re   = [...reparsed.debts].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    for (let i = 0; i < orig.length; i++) {
      const o = orig[i]!;
      const r = re[i]!;
      expect(r.amount).toBe(o.amount);
      expect(r.dueDate).toBe(o.dueDate);
      expect(r.person).toBe(o.person);
      expect(r.note).toBe(o.note);
      expect(r.status).toBe(o.status);
      expect(r.currency).toBe(o.currency);
    }
  });
});