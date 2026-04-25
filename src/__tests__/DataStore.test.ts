import { describe, it, expect, mock } from 'bun:test';
import { DataStore } from '../store/DataStore.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeExpenseInput(overrides: Partial<Parameters<DataStore['addExpense']>[0]> = {}) {
  return {
    date: '2026-04-25',
    amount: 1500000,
    currency: 'XOF',
    type: 'food' as const,
    note: 'rice and vegetables',
    ...overrides,
  };
}

describe('DataStore', () => {
  describe('addExpense', () => {
    it('returns object with id in UUID format', () => {
      const store = new DataStore();
      const expense = store.addExpense(makeExpenseInput());
      expect(expense.id).toMatch(UUID_RE);
    });

    it('getExpenses() returns the added expense', () => {
      const store = new DataStore();
      store.addExpense(makeExpenseInput());
      expect(store.getExpenses()).toHaveLength(1);
    });
  });

  describe('getExpensesByDate', () => {
    it('returns only expenses on that date', () => {
      const store = new DataStore();
      store.addExpense(makeExpenseInput({ date: '2026-04-25' }));
      store.addExpense(makeExpenseInput({ date: '2026-04-24' }));
      const results = store.getExpensesByDate('2026-04-25');
      expect(results).toHaveLength(1);
      expect(results[0]!.date).toBe('2026-04-25');
    });
  });

  describe('getExpensesByType', () => {
    it('returns only food expenses', () => {
      const store = new DataStore();
      store.addExpense(makeExpenseInput({ type: 'food' }));
      store.addExpense(makeExpenseInput({ type: 'misc' }));
      const results = store.getExpensesByType('food');
      expect(results).toHaveLength(1);
      expect(results[0]!.type).toBe('food');
    });
  });

  describe('deleteExpense', () => {
    it('removes the record from getExpenses()', () => {
      const store = new DataStore();
      const expense = store.addExpense(makeExpenseInput());
      store.deleteExpense(expense.id);
      expect(store.getExpenses()).toHaveLength(0);
    });
  });

  describe('updateExpense', () => {
    it('changes only the note field', () => {
      const store = new DataStore();
      const expense = store.addExpense(makeExpenseInput({ note: 'original' }));
      const updated = store.updateExpense(expense.id, { note: 'updated' });
      expect(updated.note).toBe('updated');
      expect(updated.type).toBe('food');
      expect(updated.id).toBe(expense.id);
    });
  });

  describe('getMonthlyExpenseTotal', () => {
    it('returns sum in cents of all April 2026 expenses', () => {
      const store = new DataStore();
      store.addExpense(makeExpenseInput({ date: '2026-04-25', amount: 1000 }));
      store.addExpense(makeExpenseInput({ date: '2026-04-10', amount: 2000 }));
      store.addExpense(makeExpenseInput({ date: '2026-03-31', amount: 9999 })); // different month
      expect(store.getMonthlyExpenseTotal(2026, 4)).toBe(3000);
    });
  });

  describe('getExpenseSummaryByType', () => {
    it('returns correct sums per type for the given month', () => {
      const store = new DataStore();
      store.addExpense(makeExpenseInput({ date: '2026-04-25', type: 'food', amount: 500 }));
      store.addExpense(makeExpenseInput({ date: '2026-04-25', type: 'food', amount: 300 }));
      store.addExpense(makeExpenseInput({ date: '2026-04-25', type: 'misc', amount: 100 }));
      const summary = store.getExpenseSummaryByType(2026, 4);
      expect(summary.food).toBe(800);
      expect(summary.misc).toBe(100);
      expect(summary.subscription).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('listener is called after addExpense', () => {
      const store = new DataStore();
      let callCount = 0;
      store.subscribe(() => { callCount++; });
      store.addExpense(makeExpenseInput());
      expect(callCount).toBe(1);
    });

    it('returned unsubscribe stops listener from being called', () => {
      const store = new DataStore();
      let callCount = 0;
      const unsubscribe = store.subscribe(() => { callCount++; });
      unsubscribe();
      store.addExpense(makeExpenseInput());
      expect(callCount).toBe(0);
    });

    it('listener that throws does not break other listeners', () => {
      const store = new DataStore();
      let secondCalled = false;
      store.subscribe(() => { throw new Error('boom'); });
      store.subscribe(() => { secondCalled = true; });
      // Should not throw
      expect(() => store.addExpense(makeExpenseInput())).not.toThrow();
      expect(secondCalled).toBe(true);
    });
  });
});