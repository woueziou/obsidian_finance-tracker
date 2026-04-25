import { describe, it, expect } from 'bun:test';
import { parseExpenses } from '../parsers/expenseParser.ts';

// Helper: build a lines array with "## Expenses" at index 0
function makeLines(body: string[]): string[] {
  return ['## Expenses', ...body];
}

describe('parseExpenses', () => {
  it('parses a full line with location', () => {
    const lines = makeLines(['', '### 2026-04-25', '- [food] 15000 XOF @ market: rice and vegetables']);
    const { expenses, errors } = parseExpenses(lines, 0);
    expect(errors).toHaveLength(0);
    expect(expenses).toHaveLength(1);
    const e = expenses[0]!;
    expect(e.type).toBe('food');
    expect(e.amount).toBe(1500000);   // 15000 * 100
    expect(e.currency).toBe('XOF');
    expect(e.location).toBe('market');
    expect(e.note).toBe('rice and vegetables');
    expect(e.date).toBe('2026-04-25');
  });

  it('parses a line without location — location is undefined', () => {
    const lines = makeLines(['### 2026-04-25', '- [subscription] 3000 XOF: Netflix monthly']);
    const { expenses, errors } = parseExpenses(lines, 0);
    expect(errors).toHaveLength(0);
    expect(expenses[0]!.location).toBeUndefined();
    expect(expenses[0]!.note).toBe('Netflix monthly');
  });

  it('stores amount as cents: 15000 in markdown → 1500000 in object', () => {
    const lines = makeLines(['### 2026-01-01', '- [misc] 15000 XOF: test']);
    const { expenses } = parseExpenses(lines, 0);
    expect(expenses[0]!.amount).toBe(1500000);
  });

  it('unknown type [luxury] → ParseError, expense excluded', () => {
    const lines = makeLines(['### 2026-04-25', '- [luxury] 5000 XOF: watch']);
    const { expenses, errors } = parseExpenses(lines, 0);
    expect(expenses).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('luxury');
  });

  it('expense line before any date heading → ParseError with "date" in message', () => {
    const lines = makeLines(['- [food] 1000 XOF: snack']);
    const { expenses, errors } = parseExpenses(lines, 0);
    expect(expenses).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message.toLowerCase()).toContain('date');
  });

  it('note containing colon is captured correctly', () => {
    const lines = makeLines(['### 2026-04-25', '- [misc] 500 XOF: 09:00 meeting snack']);
    const { expenses } = parseExpenses(lines, 0);
    expect(expenses[0]!.note).toBe('09:00 meeting snack');
  });

  it('note containing @ is captured correctly', () => {
    const lines = makeLines(['### 2026-04-25', '- [misc] 500 XOF: transfer @ bank']);
    const { expenses } = parseExpenses(lines, 0);
    expect(expenses[0]!.note).toBe('transfer @ bank');
  });

  it('stops parsing at the next ## section', () => {
    const lines = makeLines([
      '### 2026-04-25',
      '- [food] 1000 XOF: lunch',
      '## Income',
      '### 2026-04-25',
      '- [food] 999 XOF: should not appear',
    ]);
    const { expenses } = parseExpenses(lines, 0);
    expect(expenses).toHaveLength(1);
  });
});