# Phase 6 — Export & Import: Context

## Why This Phase Exists

The plugin stores data in a markdown file. That format is great for reading and version control, but not for analysis in Excel, loading into a SQL database, or archiving. Phase 6 adds the ability to export all data to CSV, JSON, and SQL — and import it back in without data loss.

This phase also enables backup workflows: export to JSON monthly, store in a separate location, reimport if the vault is lost.

## What This Phase Covers

- `src/export/csvExporter.ts` + `csvImporter.ts`
- `src/export/jsonExporter.ts` + `jsonImporter.ts`
- `src/export/sqlExporter.ts` + `sqlImporter.ts`
- `src/export/index.ts`
- Export/import commands registered in `main.ts`

## What This Phase Does NOT Cover

- Analytics charts over exported data (Phase 7)
- Automated/scheduled exports (future)

## Inputs

- Phase 2: `DataStore` (all records)
- Phase 3: Plugin settings (export directory)
- Phase 1: `Expense`, `Income`, `Debt` types

## Outputs

- Commands: "Export as CSV", "Export as JSON", "Export as SQL"
- Commands: "Import from CSV", "Import from JSON"
- Files written to `settings.exportDirectory` inside the vault
- Import deduplicates by `id`

## Risk

Low. No Obsidian-specific complexity. The main risk is CSV escaping edge cases (commas/quotes in notes) and ensuring SQL escaping prevents any form of injection in the generated file.
