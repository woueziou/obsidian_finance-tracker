// src/parsers/incomeParser.ts
// Pure function — no side effects, no ID assignment.

import type { Income, ParseError } from '../types.ts';
import { IncomeTypeSchema } from '../schemas.ts';

// Internal type — not exported. MarkdownSerializer.deserialize() assigns IDs.
type ParsedIncome = Omit<Income, 'id'>;

const DATE_HEADING = /^### (\d{4}-\d{2}-\d{2})$/;
const INCOME_LINE  = /^- \[(\w+)\] (\d+) ([A-Z]{3}) from: (.+)$/;

export interface IncomeParseResult {
  incomes: ParsedIncome[];
  errors: ParseError[];
}

/**
 * Parses lines belonging to the ## Income section.
 * `lines` is the full file line array; `startIndex` is the index of the
 * "## Income" header line. Parsing stops when a new "## " section is found.
 */
export function parseIncomes(lines: readonly string[], startIndex: number): IncomeParseResult {
  const incomes: ParsedIncome[] = [];
  const errors: ParseError[] = [];

  let currentDate: string | null = null;

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    if (/^## /.test(line)) break;

    const dateMatch = line.match(DATE_HEADING);
    if (dateMatch !== null) {
      const d = dateMatch[1];
      if (d !== undefined) currentDate = d;
      continue;
    }

    if (!line.startsWith('- ')) continue;

    const incomeMatch = line.match(INCOME_LINE);
    if (incomeMatch === null) continue;

    const rawType = incomeMatch[1];
    if (rawType === undefined) continue;

    const parseType = IncomeTypeSchema.safeParse(rawType);
    if (!parseType.success) {
      errors.push({
        line: i + 1,
        raw: line,
        message: `Unknown income type: "${rawType}"`,
      });
      continue;
    }

    if (currentDate === null) {
      errors.push({
        line: i + 1,
        raw: line,
        message: 'Income line found before any date heading',
      });
      continue;
    }

    const rawAmount = incomeMatch[2];
    const rawCurrency = incomeMatch[3];
    const rawSource = incomeMatch[4];

    if (rawAmount === undefined || rawCurrency === undefined || rawSource === undefined) continue;

    const amount = parseInt(rawAmount, 10) * 100;
    const currency = rawCurrency;
    const source = rawSource.trim();

    incomes.push({
      date: currentDate,
      amount,
      currency,
      type: parseType.data,
      // The DSL has no separate note field for income — use source text for both
      note: source,
      source,
    });
  }

  return { incomes, errors };
}