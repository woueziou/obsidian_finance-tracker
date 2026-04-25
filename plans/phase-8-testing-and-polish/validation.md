# Phase 8 — Testing & Polish: Validation Checklist

This is the final gate. All items must be checked before the plugin is considered production-ready for personal use.

---

## Automated Tests

Run `bun test` or `npm test`:

- [ ] `expenseParser.test.ts` — all tests pass
- [ ] `incomeParser.test.ts` — all tests pass
- [ ] `debtParser.test.ts` — all tests pass
- [ ] `DataStore.test.ts` — all tests pass (including pub/sub, aggregations)
- [ ] `MarkdownSerializer.test.ts` — all tests pass
- [ ] `csvExporter.test.ts` — all tests pass (including comma/quote escaping)
- [ ] `jsonExporter.test.ts` — all tests pass
- [ ] `sqlExporter.test.ts` — all tests pass
- [ ] `analytics.test.ts` — all tests pass
- [ ] `formatters.test.ts` — all tests pass
- [ ] `roundTrip.test.ts` — all three record types pass, idempotent serialization passes
- [ ] Zero failing tests
- [ ] Zero test output errors (no uncaught exceptions in test runner)

---

## Coverage

Run `bun test --coverage` or `npx jest --coverage`:

- [ ] `expenseParser.ts` ≥ 80% statement coverage
- [ ] `incomeParser.ts` ≥ 80% statement coverage
- [ ] `debtParser.ts` ≥ 80% statement coverage
- [ ] `DataStore.ts` ≥ 80% statement coverage
- [ ] `csvExporter.ts` ≥ 80% statement coverage
- [ ] `jsonExporter.ts` ≥ 80% statement coverage
- [ ] `analytics.ts` ≥ 80% statement coverage

---

## TypeScript

- [ ] `tsc --noEmit --strict` exits with code 0 (zero errors)
- [ ] `grep -rn ': any' src/ --include='*.ts'` → no results
- [ ] `grep -rn 'as any' src/ --include='*.ts'` → no results
- [ ] `grep -rn 'enum ' src/ --include='*.ts'` → no results

---

## Code Cleanliness

- [ ] `grep -rn 'console\.log' src/ --include='*.ts'` → no results
- [ ] No commented-out code blocks longer than 1 line
- [ ] No `// TODO` comments that represent unfinished functionality
- [ ] All files have consistent indentation (2 spaces)

---

## Build

- [ ] `npm run build` (or `bun run build`) exits with code 0
- [ ] `main.js` file size is reasonable (< 1 MB for personal use plugin)
- [ ] `styles.css` exists and contains the `.finance-tracker-error` and `.finance-stats-grid` rules

---

## README

- [ ] README exists and is not the sample plugin's default README
- [ ] Installation section explains manual install steps clearly
- [ ] DSL Reference section covers all three record types with examples
- [ ] Settings section documents all three settings fields
- [ ] Export/Import section has usage examples
- [ ] Troubleshooting section addresses the three most common issues
- [ ] README is readable without prior knowledge of the codebase

---

## Manual End-to-End Test (clean dev vault)

- [ ] Step 1: Plugin enables, `finance-ledger.md` created
- [ ] Step 2: Add 3 expenses — appear in ledger file
- [ ] Step 3: Add 1 income — appears in ledger file
- [ ] Step 4: Add 1 debt — appears in ledger file
- [ ] Step 5: Dashboard opens, totals are correct
- [ ] Step 6: Export CSV — file created, opens in spreadsheet correctly
- [ ] Step 7: Export JSON — valid JSON, reimport shows "N skipped"
- [ ] Step 8: Export SQL — `sqlite3` accepts without errors
- [ ] Step 9: External ledger edit — FileWatcher prompt appears
- [ ] Step 10: Reload — all records present
- [ ] Step 11: Settings change + restart — settings persisted
- [ ] Step 12: Disable plugin — no console errors

---

## Phase Exit Criteria (project complete)

- [ ] All automated tests pass with zero failures
- [ ] Coverage ≥ 80% on all core modules
- [ ] TypeScript strict build clean
- [ ] Zero `console.log` in production code
- [ ] README complete
- [ ] Manual 12-step test passes entirely
- [ ] Plugin is installed and running in the daily-use vault
