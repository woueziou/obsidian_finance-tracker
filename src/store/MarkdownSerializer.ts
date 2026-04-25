// src/store/MarkdownSerializer.ts
// Bidirectional conversion between a markdown string and a Ledger object.
// This is the ONLY place crypto.randomUUID() is called during a file load.

import type { Ledger, LedgerMeta, ParseError, ParseResult } from '../types.ts';
import type { Expense, Income, Debt } from '../schemas.ts';
import { parseExpenses } from '../parsers/expenseParser.ts';
import { parseIncomes } from '../parsers/incomeParser.ts';
import { parseDebts } from '../parsers/debtParser.ts';
import type { DataStore } from './DataStore.ts';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Frontmatter helpers
// ---------------------------------------------------------------------------

interface FrontmatterResult {
  meta: Partial<LedgerMeta>;
  body: string;
}

function parseFrontmatter(content: string): FrontmatterResult {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const rawMetaBlock = match[1];
  const body         = match[2];

  if (rawMetaBlock === undefined || body === undefined) {
    return { meta: {}, body: content };
  }

  const titleMatch    = rawMetaBlock.match(/^title:\s*(.+)$/m);
  const currencyMatch = rawMetaBlock.match(/^currency:\s*(.+)$/m);
  const updatedMatch  = rawMetaBlock.match(/^updated:\s*(.+)$/m);

  const title    = titleMatch?.[1]?.trim();
  const currency = currencyMatch?.[1]?.trim();
  const updated  = updatedMatch?.[1]?.trim();

  return {
    meta: {
      ...(title    !== undefined && { title }),
      ...(currency !== undefined && { currency }),
      ...(updated  !== undefined && { updated }),
    },
    body,
  };
}

function serializeFrontmatter(meta: LedgerMeta): string {
  return `---\ntitle: ${meta.title}\ncurrency: ${meta.currency}\nupdated: ${meta.updated}\n---`;
}

// ---------------------------------------------------------------------------
// Section index helpers
// ---------------------------------------------------------------------------

function findSectionIndex(lines: string[], pattern: RegExp): number {
  return lines.findIndex(l => pattern.test(l));
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

function serializeExpenseLine(e: Expense): string {
  const location = e.location ? ` @ ${e.location}` : '';
  return `- [${e.type}] ${e.amount / 100} ${e.currency}${location}: ${e.note}`;
}

function serializeIncomeLine(i: Income): string {
  return `- [${i.type}] ${i.amount / 100} ${i.currency} from: ${i.source}`;
}

function serializeDebtLine(d: Debt): string {
  let line = `- amount: ${d.amount / 100} ${d.currency}, due: ${d.dueDate}, person: ${d.person}, note: ${d.note}`;
  if (d.status !== 'open') line += `, status: ${d.status}`;
  if (d.interestRate !== undefined) line += `, rate: ${d.interestRate}`;
  return line;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const MarkdownSerializer = {

  /**
   * Parse a markdown ledger string into a fully-hydrated Ledger.
   * UUIDs are assigned here — parsers return id-less records.
   */
  deserialize(content: string): ParseResult {
    if (content.trim() === '') {
      return {
        ledger: {
          expenses: [],
          incomes: [],
          debts: [],
          meta: { title: 'Finance Ledger', currency: 'XOF', updated: '2026-01-01' },
        },
        errors: [],
      };
    }

    const { meta: rawMeta, body } = parseFrontmatter(content);
    const lines = body.split('\n');
    const allErrors: ParseError[] = [];

    // Locate section headers
    const expenseIdx = findSectionIndex(lines, /^## Expenses$/i);
    const incomeIdx  = findSectionIndex(lines, /^## Income$/i);
    const debtIdx    = findSectionIndex(lines, /^## Debts$/i);

    // Parse each section (parsers stop at the next ## heading)
    const { expenses: parsedExpenses, errors: expenseErrors } =
      expenseIdx >= 0
        ? parseExpenses(lines, expenseIdx)
        : { expenses: [], errors: [] };

    const { incomes: parsedIncomes, errors: incomeErrors } =
      incomeIdx >= 0
        ? parseIncomes(lines, incomeIdx)
        : { incomes: [], errors: [] };

    const { debts: parsedDebts, errors: debtErrors } =
      debtIdx >= 0
        ? parseDebts(lines, debtIdx)
        : { debts: [], errors: [] };

    allErrors.push(...expenseErrors, ...incomeErrors, ...debtErrors);

    // Mint UUIDs — this is the only place during a file load
    const expenses: Expense[] = parsedExpenses.map(e => ({
      ...e,
      id: crypto.randomUUID(),
    }));
    const incomes: Income[] = parsedIncomes.map(i => ({
      ...i,
      id: crypto.randomUUID(),
    }));
    const debts: Debt[] = parsedDebts.map(d => ({
      ...d,
      id: crypto.randomUUID(),
    }));

    // Build meta with defaults for missing fields
    const meta: LedgerMeta = {
      title:    rawMeta.title    ?? 'Finance Ledger',
      currency: rawMeta.currency ?? 'XOF',
      updated:  (rawMeta.updated && ISO_DATE_RE.test(rawMeta.updated))
                  ? rawMeta.updated
                  : new Date().toISOString().slice(0, 10),
    };

    return {
      ledger: { expenses, incomes, debts, meta },
      errors: allErrors,
    };
  },

  /**
   * Serialize a DataStore's current state to a canonical markdown string.
   * - Expenses grouped by date, dates sorted descending
   * - Incomes grouped by date, dates sorted descending
   * - Debts sorted by dueDate ascending
   * - `updated` in frontmatter is set to today's date
   */
  serialize(store: DataStore, meta: LedgerMeta): string {
    const today = new Date().toISOString().slice(0, 10);
    const updatedMeta: LedgerMeta = { ...meta, updated: today };

    const frontmatter = serializeFrontmatter(updatedMeta);

    // ---- Expenses section ----
    const expensesByDate = new Map<string, Expense[]>();
    for (const e of store.getExpenses()) {
      const group = expensesByDate.get(e.date) ?? [];
      group.push(e);
      expensesByDate.set(e.date, group);
    }
    const expenseDates = [...expensesByDate.keys()].sort((a, b) => b.localeCompare(a));

    const expenseLines: string[] = ['## Expenses'];
    for (const date of expenseDates) {
      expenseLines.push('');
      expenseLines.push(`### ${date}`);
      for (const e of expensesByDate.get(date)!) {
        expenseLines.push(serializeExpenseLine(e));
      }
    }

    // ---- Income section ----
    const incomesByDate = new Map<string, Income[]>();
    for (const i of store.getIncomes()) {
      const group = incomesByDate.get(i.date) ?? [];
      group.push(i);
      incomesByDate.set(i.date, group);
    }
    const incomeDates = [...incomesByDate.keys()].sort((a, b) => b.localeCompare(a));

    const incomeLines: string[] = ['## Income'];
    for (const date of incomeDates) {
      incomeLines.push('');
      incomeLines.push(`### ${date}`);
      for (const i of incomesByDate.get(date)!) {
        incomeLines.push(serializeIncomeLine(i));
      }
    }

    // ---- Debts section ----
    const sortedDebts = store.getDebts().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const debtLines: string[] = ['## Debts'];
    if (sortedDebts.length > 0) {
      debtLines.push('');
      for (const d of sortedDebts) {
        debtLines.push(serializeDebtLine(d));
      }
    }

    const sections = [
      frontmatter,
      expenseLines.join('\n'),
      incomeLines.join('\n'),
      debtLines.join('\n'),
    ];

    return sections.join('\n\n');
  },
};