import { describe, it, expect } from 'bun:test';
import { parseDebts } from '../parsers/debtParser.ts';

function makeLines(body: string[]): string[] {
  return ['## Debts', ...body];
}

describe('parseDebts', () => {
  it('parses full debt line with all fields', () => {
    const lines = makeLines([
      '- amount: 200000 XOF, due: 2026-12-31, person: Bank, note: equipment, status: open, rate: 5.0',
    ]);
    const { debts, errors } = parseDebts(lines, 0);
    expect(errors).toHaveLength(0);
    expect(debts).toHaveLength(1);
    const d = debts[0]!;
    expect(d.amount).toBe(20000000); // 200000 * 100
    expect(d.currency).toBe('XOF');
    expect(d.dueDate).toBe('2026-12-31');
    expect(d.person).toBe('Bank');
    expect(d.note).toBe('equipment');
    expect(d.status).toBe('open');
    expect(d.interestRate).toBe(5.0);
  });

  it('status defaults to open when absent', () => {
    const lines = makeLines([
      '- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan',
    ]);
    const { debts } = parseDebts(lines, 0);
    expect(debts[0]!.status).toBe('open');
  });

  it('interestRate is undefined when absent', () => {
    const lines = makeLines([
      '- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan',
    ]);
    const { debts } = parseDebts(lines, 0);
    expect(debts[0]!.interestRate).toBeUndefined();
  });

  it('interestRate 5.0 is parsed as number 5.0', () => {
    const lines = makeLines([
      '- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: loan, rate: 5.0',
    ]);
    const { debts } = parseDebts(lines, 0);
    expect(debts[0]!.interestRate).toBe(5.0);
  });

  it('parses partial status correctly', () => {
    const lines = makeLines([
      '- amount: 50000 XOF, due: 2026-05-15, person: Ama, note: tontine, status: partial',
    ]);
    const { debts } = parseDebts(lines, 0);
    expect(debts[0]!.status).toBe('partial');
  });
});