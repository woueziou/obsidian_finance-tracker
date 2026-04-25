# Phase 6 — Export & Import: User Stories

## Story 1 — Export all data to CSV for Excel analysis

**As a** user who wants to analyze spending in a spreadsheet,  
**I want** to run "Export as CSV" and get a file I can open in Excel or Google Sheets,  
**So that** I can build my own pivot tables and filters without being limited to the plugin's built-in views.

**Acceptance criteria:**
- Command "Finance Tracker: Export as CSV" appears in the command palette
- Running it creates a file in the configured export directory (e.g., `Finance/exports/finance-2026-04-25.csv`)
- The file contains all three record types with correct headers
- Opening in Excel shows readable rows with correct amounts and dates
- Notes containing commas or quotes are properly escaped and readable in Excel

---

## Story 2 — Export to JSON for backup and automation

**As a** developer who wants a machine-readable backup of all finance data,  
**I want** to export to JSON with metadata,  
**So that** I can write scripts against the export file or import it into another tool.

**Acceptance criteria:**
- Command "Finance Tracker: Export as JSON" creates a `.json` file
- The file is valid JSON (passes `JSON.parse()`)
- Top-level structure: `{ meta: { exportedAt, currency, version }, expenses: [...], incomes: [...], debts: [...] }`
- All amounts are integers (cents) in the JSON
- All record `id` fields are present

---

## Story 3 — Export to SQL for database loading

**As a** developer who wants to load finance data into a SQLite database,  
**I want** to export as SQL and run it with `sqlite3`,  
**So that** I can query the data with SQL joins and aggregations.

**Acceptance criteria:**
- Command "Finance Tracker: Export as SQL" creates a `.sql` file
- Running the file with `sqlite3 finance.db < export.sql` succeeds without errors
- Three tables are created: `expenses`, `incomes`, `debts`
- All rows from the export file appear in the database
- Notes containing single quotes are escaped (no SQL errors)

---

## Story 4 — Import JSON without duplicating records

**As a** user who exported data last month and wants to restore records after a vault migration,  
**I want** to import the JSON file and have only new records added (not duplicates),  
**So that** I can safely re-run imports without corrupting my data.

**Acceptance criteria:**
- Command "Finance Tracker: Import from JSON" opens a file picker or accepts a path
- Records already in the DataStore (matched by `id`) are skipped
- New records are added to the DataStore and scheduled for a file write
- A Notice reports: "Import complete: X added, Y skipped"

---

## Story 5 — Import CSV without duplicating records

**As a** user restoring from a CSV backup,  
**I want** the same deduplication behavior as JSON import,  
**So that** re-importing the same file multiple times is safe.

**Acceptance criteria:**
- "Finance Tracker: Import from CSV" processes the file
- Existing records are skipped; new records are added
- Import summary Notice is shown

---

## Story 6 — Export directory is created automatically

**As a** user who hasn't manually created the export folder,  
**I want** the plugin to create `Finance/exports/` automatically on first export,  
**So that** I don't get an error and have to create the folder myself.

**Acceptance criteria:**
- Running any export command when the export directory doesn't exist creates the directory
- The export file is successfully created inside it
- No error Notice appears

---

## Story 7 — Export with no data produces an empty-but-valid file

**As a** developer testing the plugin on a fresh vault,  
**I want** exporting with zero records to produce a valid but empty file,  
**So that** the export command doesn't crash when the ledger is empty.

**Acceptance criteria:**
- Exporting CSV with no expenses produces a file with only the header row
- Exporting JSON with no data produces `{ meta: {...}, expenses: [], incomes: [], debts: [] }`
- Exporting SQL with no data produces CREATE TABLE statements with no INSERT statements
- No error Notice or console crash
