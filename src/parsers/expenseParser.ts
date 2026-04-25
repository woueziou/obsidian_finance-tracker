// src/parsers/expenseParser.ts
// Pure function — no side effects, no ID assignment.

import type { Expense, ParseError } from '../types.ts';
import { ExpenseTypeSchema } from '../schemas.ts';

// Internal type — not exported. MarkdownSerializer.deserialize() assigns IDs.
type ParsedExpense = Omit<Expense, 'id'>;

const DATE_HEADING = /^### (\d{4}-\d{2}-\d{2})$/;
const EXPENSE_LINE = /^- \[(\w+)\] (\d+) ([A-Z]{3})(?: @ ([^:]+))?: (.+)$/;

export interface ExpenseParseResult {
  expenses: ParsedExpense[];
  errors: ParseError[];
}

/**
 * Parses lines belonging to the ## Expenses section.
 * `lines` is the full file line array; `startIndex` is the index of the
 * "## Expenses" header line. Parsing stops when a new "## " section is found.
 */
export function parseExpenses(lines: readonly string[], startIndex: number): ExpenseParseResult {
  const expenses: ParsedExpense[] = [];
  const errors: ParseError[] = [];

  let currentDate: string | null = null;

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Stop at the next top-level section heading
    if (/^## /.test(line)) break;

    // Date heading
    const dateMatch = line.match(DATE_HEADING);
    if (dateMatch !== null) {
      const d = dateMatch[1];
      if (d !== undefined) currentDate = d;
      continue;
    }

    // Skip non-list lines (blank lines, etc.)
    if (!line.startsWith('- ')) continue;

    const expenseMatch = line.match(EXPENSE_LINE);
    if (expenseMatch === null) continue;

    const rawType = expenseMatch[1];
    if (rawType === undefined) continue;

    const parseType = ExpenseTypeSchema.safeParse(rawType);
    if (!parseType.success) {
      errors.push({
        line: i + 1,
        raw: line,
        message: `Unknown expense type: "${rawType}"`,
      });
      continue;
    }

    if (currentDate === null) {
      errors.push({
        line: i + 1,
        raw: line,
        message: 'Expense line found before any date heading',
      });
      continue;
    }

    const rawAmount = expenseMatch[2];
    const rawCurrency = expenseMatch[3];
    const rawLocation = expenseMatch[4];
    const rawNote = expenseMatch[5];

    if (rawAmount === undefined || rawCurrency === undefined || rawNote === undefined) continue;

    const amount = parseInt(rawAmount, 10) * 100;
    const currency = rawCurrency;
    const location = rawLocation !== undefined ? rawLocation.trim() : undefined;
    const note = rawNote.trim();

    expenses.push({
      date: currentDate,
      amount,
      currency,
      type: parseType.data,
      note,
      location,
    });
  }

  return { expenses, errors };
}