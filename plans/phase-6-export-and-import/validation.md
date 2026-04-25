# Phase 6 — Export & Import: Validation Checklist

---

## Build

- [ ] `tsc --noEmit --strict` clean on all files in `src/export/`
- [ ] No `any` in exporter or importer files

---

## CSV Escaper Unit Tests

- [ ] `csvField('rice and vegetables')` → `rice and vegetables` (no wrapping)
- [ ] `csvField('rice, beans')` → `"rice, beans"` (comma → wrapped)
- [ ] `csvField('uncle"s gift')` → `"uncle""s gift"` (quote → double-quote escaped)
- [ ] `csvField('')` → `` (empty string)
- [ ] `csvField(undefined)` → `` (undefined → empty)
- [ ] `csvField(1500000)` → `1500000` (number → string)

---

## SQL Escaper Unit Tests

- [ ] `sqlStr("laptop loan")` → `'laptop loan'`
- [ ] `sqlStr("it's broken")` → `'it''s broken'` (single quote doubled)
- [ ] `sqlStr("")` → `''`
- [ ] `sqlStr("DROP TABLE")` → `'DROP TABLE'` (SQL keywords are safe inside quotes)

---

## CSV Export (manual test)

Seed 3 expenses (one with a comma in the note, one with a quote in the note), 2 incomes, 1 debt.

- [ ] "Finance Tracker: Export as CSV" command exists in command palette
- [ ] File created at `Finance/exports/finance-YYYY-MM-DD.csv`
- [ ] File opens in spreadsheet without errors
- [ ] Row count matches record count (plus header)
- [ ] Note with comma is correctly quoted in CSV (readable in Excel as single cell)
- [ ] Note with double-quote is correctly escaped

---

## JSON Export (manual test)

- [ ] "Finance Tracker: Export as JSON" creates `.json` file
- [ ] `JSON.parse(content)` succeeds in browser console
- [ ] `meta.exportedAt` is a valid ISO datetime string
- [ ] `meta.version` === `'1.0'`
- [ ] `expenses.length` === DataStore expense count
- [ ] All `id` fields are present and are UUIDs
- [ ] All amounts are integers (no decimals)

---

## SQL Export (manual test)

- [ ] "Finance Tracker: Export as SQL" creates `.sql` file
- [ ] Running `sqlite3 :memory: < finance.sql` in a terminal exits with code 0
- [ ] Three tables exist in the output: `expenses`, `incomes`, `debts`
- [ ] Row count in each table matches DataStore record count
- [ ] Note containing `'` (apostrophe) does not break the SQL

---

## JSON Round-Trip Test

1. Export to JSON
2. Delete all records (or use a fresh DataStore)
3. Import the JSON file
4. Verify record counts match
5. Verify amounts match exactly
6. Import the same file again
7. Verify skipped count equals total records (no duplicates)

- [ ] Step 3–4: record counts match after import
- [ ] Step 5: amounts match (no float drift)
- [ ] Step 6–7: second import skips all records

---

## CSV Round-Trip Test

Same sequence as JSON round-trip:
- [ ] Export → clear → import → counts match
- [ ] Re-import → all skipped

---

## Edge Cases

- [ ] Export with empty DataStore → valid but empty files (no crash)
- [ ] Import JSON with unknown fields → accepted or skipped gracefully (no crash)
- [ ] Import malformed JSON → error Notice shown, no crash
- [ ] Import CSV with wrong column count → row skipped, others continue

---

## Phase Exit Criteria

- [ ] All three export formats work end-to-end
- [ ] CSV and JSON importers work with deduplication
- [ ] Round-trip tests pass for both CSV and JSON
- [ ] SQL file passes `sqlite3` syntax check
- [ ] Export directory is auto-created
- [ ] `tsc --noEmit --strict` clean
