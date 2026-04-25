# Phase 6 — Export & Import: Research

## CSV Escaping Rules (RFC 4180)

1. Fields containing `,`, `"`, `\n`, or `\r` must be wrapped in double-quotes
2. A double-quote inside a quoted field is escaped by doubling it: `""` 
3. Line endings: `\n` (LF) is acceptable; `\r\n` (CRLF) is the official standard but LF works in all modern tools
4. Fields with only spaces do not need quoting (but quoting is harmless)

```
"rice and vegetables"         → rice and vegetables          (no escaping needed)
"rice, beans"                 → "rice, beans"                (comma → quote wrapping)
'uncle"s gift'                → "uncle""s gift"              (quote → double-quote escape)
"line1\nline2"                → "line1\nline2"               (newline → quote wrapping)
```

Test your `csvField()` function with these exact inputs.

---

## JSON vs NDJSON

Standard JSON (single document) is used here. NDJSON (one JSON object per line) is an alternative for streaming large exports, but is overkill for personal ledger sizes.

JSON export advantages:
- Human-readable with `JSON.stringify(data, null, 2)`
- Supports nested meta object alongside records
- Directly importable with `JSON.parse()`
- No parsing library needed

---

## SQL Dialects: INSERT OR REPLACE vs ON CONFLICT

| Dialect | Upsert syntax |
|---|---|
| SQLite | `INSERT OR REPLACE INTO table (...) VALUES (...)` |
| PostgreSQL | `INSERT INTO table (...) VALUES (...) ON CONFLICT (id) DO UPDATE SET ...` |
| MySQL | `INSERT INTO table (...) VALUES (...) ON DUPLICATE KEY UPDATE ...` |

For MVP, SQLite is the primary target. The dialect flag allows basic Postgres/MySQL support.

---

## SQL Injection Prevention

The exported `.sql` file is a static file — it will be executed by the user in their own database, not by the plugin. However, malformed data in notes (e.g., a note containing SQL keywords) could produce invalid SQL.

The `sqlStr()` function (escape single quotes by doubling) is sufficient protection:
```typescript
function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
```

Never use template literals to embed user data directly:
```typescript
// BAD:
`INSERT INTO expenses VALUES ('${e.note}')` // breaks if note contains '

// GOOD:
`INSERT INTO expenses VALUES (${sqlStr(e.note)})`
```

---

## Obsidian Vault File Creation

```typescript
// Create a new file (fails if it already exists)
await this.app.vault.create('exports/file.csv', content);

// Create or overwrite (use adapter directly):
await this.app.vault.adapter.write('exports/file.csv', content);

// Create folder if not exists:
const folder = this.app.vault.getFolderByPath('Finance/exports');
if (!folder) await this.app.vault.createFolder('Finance/exports');
```

`vault.adapter.write()` bypasses the TFile abstraction and always overwrites. Use it for export files where overwriting is the desired behavior (re-exporting same date produces same filename).

---

## Import Deduplication Strategy

Records are deduplicated by `id`. This means:

1. Export on 2026-04-01 → file contains records A, B, C
2. Add record D on 2026-04-05
3. Export again → file contains A, B, C, D
4. Import the April 1st file → A, B, C skipped (already exist), 0 added
5. Import the April 5th file → D added (new)

This is correct behavior. The user can safely re-import without duplicating.

For the markdown re-parse case: IDs are not stored in markdown, so deduplication doesn't apply — the DataStore is fully replaced on reload.

---

## CSV Parsing for Import

A minimal CSV parser (no external library):

```typescript
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; i++; // escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current); current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
```

This handles: quoted fields, escaped quotes, commas inside quotes. Does not handle multiline fields (notes with `\n`) — this is an accepted MVP limitation.

---

## Export File Naming

```typescript
function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Results in:
// Finance/exports/finance-2026-04-25.csv
// Finance/exports/finance-2026-04-25.json
// Finance/exports/finance-2026-04-25.sql
```

Exporting twice in one day overwrites the file — use `vault.adapter.write()` for this.
