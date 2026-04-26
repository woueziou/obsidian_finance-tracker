// src/parsers/debtParser.ts
// Pure function — no side effects, no ID assignment.

import type { Debt, ParseError } from '../types.ts';
import { DebtStatusSchema } from '../schemas.ts';

// Internal type — not exported. MarkdownSerializer.deserialize() assigns IDs.
type ParsedDebt = Omit<Debt, 'id'>;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Matches full debt line. Status and rate are optional trailing segments.
const DEBT_LINE =
  /^- amount: (\d+) ([A-Z]{3}), due: (\d{4}-\d{2}-\d{2}), person: ([^,]+), note: ([^,]+)(?:, status: (open|partial|paid))?(?:, rate: (\d+(?:\.\d+)?))?$/;

export interface DebtParseResult {
  debts: ParsedDebt[];
  errors: ParseError[];
}

/**
 * Parses lines belonging to the ## Debts section.
 * `lines` is the full file line array; `startIndex` is the index of the
 * "## Debts" header line. Parsing stops when a new "## " section is found.
 */
export function parseDebts(lines: readonly string[], startIndex: number): DebtParseResult {
  const debts: ParsedDebt[] = [];
  const errors: ParseError[] = [];

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    if (/^## /.test(line)) break;

    if (!line.startsWith('- ')) continue;

    const debtMatch = line.match(DEBT_LINE);
    if (debtMatch === null) continue;

    const rawAmount   = debtMatch[1];
    const rawCurrency = debtMatch[2];
    const rawDueDate  = debtMatch[3];
    const rawPerson   = debtMatch[4];
    const rawNote     = debtMatch[5];
    const rawStatus   = debtMatch[6]; // undefined when absent
    const rawRate     = debtMatch[7]; // undefined when absent

    if (
      rawAmount   === undefined ||
      rawCurrency === undefined ||
      rawDueDate  === undefined ||
      rawPerson   === undefined ||
      rawNote     === undefined
    ) continue;

    // Validate date format (the regex already constrains the format but we double-check)
    if (!ISO_DATE_RE.test(rawDueDate)) {
      errors.push({
        line: i + 1,
        raw: line,
        message: `Invalid due date format: "${rawDueDate}"`,
      });
      continue;
    }

    // Parse status — default 'open' when absent
    const statusResult = DebtStatusSchema.safeParse(rawStatus ?? 'open');
    if (!statusResult.success) {
      errors.push({
        line: i + 1,
        raw: line,
        message: `Unknown debt status: "${rawStatus ?? ''}"`,
      });
      continue;
    }

    const amount       = parseInt(rawAmount, 10) * 100;
    const currency     = rawCurrency;
    const dueDate      = rawDueDate;
    const person       = rawPerson.trim();
    const note         = rawNote.trim();
    const interestRate = rawRate !== undefined ? parseFloat(rawRate) : undefined;

    debts.push({
      amount,
      currency,
      dueDate,
      person,
      note,
      status: statusResult.data,
      interestRate,
    });
  }

  return { debts, errors };
}