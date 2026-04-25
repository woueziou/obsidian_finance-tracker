import { describe, it, expect } from 'bun:test';
import { parseIncomes } from '../parsers/incomeParser.ts';

function makeLines(body: string[]): string[] {
  return ['## Income', ...body];
}

describe('parseIncomes', () => {
  it('parses a salary income line correctly', () => {
    const lines = makeLines(['### 2026-04-25', '- [salary] 150000 XOF from: April freelance work']);
    const { incomes, errors } = parseIncomes(lines, 0);
    expect(errors).toHaveLength(0);
    expect(incomes).toHaveLength(1);
    const i = incomes[0]!;
    expect(i.type).toBe('salary');
    expect(i.amount).toBe(15000000); // 150000 * 100
    expect(i.currency).toBe('XOF');
    expect(i.date).toBe('2026-04-25');
    expect(i.source).toBe('April freelance work');
  });

  it('source field populated from text after from:', () => {
    const lines = makeLines(['### 2026-04-20', '- [donation] 50000 XOF from: uncle\'s gift']);
    const { incomes } = parseIncomes(lines, 0);
    expect(incomes[0]!.source).toBe("uncle's gift");
  });

  it('unknown income type → ParseError', () => {
    const lines = makeLines(['### 2026-04-25', '- [bribe] 10000 XOF from: unknown']);
    const { incomes, errors } = parseIncomes(lines, 0);
    expect(incomes).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('bribe');
  });
});