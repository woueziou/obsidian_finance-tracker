# Phase 2 — Parsing & DataStore: Research

## Regex Design for DSL Lines

### Expense line regex breakdown

Pattern: `^- \[(\w+)\] (\d+) ([A-Z]{3})(?: @ ([^:]+))?: (.+)$`

| Segment | Matches | Capture group |
|---|---|---|
| `^- \[` | Literal `- [` at line start | — |
| `(\w+)` | Type: `food`, `subscription`, etc. | group 1 |
| `\] ` | Closing bracket + space | — |
| `(\d+)` | Integer amount | group 2 |
| ` ([A-Z]{3})` | Currency code | group 3 |
| `(?: @ ([^:]+))?` | Optional ` @ location` (non-capturing outer, capturing inner) | group 4 |
| `: (.+)$` | Note (everything after colon to end of line) | group 5 |

Key: `[^:]+` for location stops at the `:` that begins the note. This handles notes containing `@` correctly.

### Debt line regex breakdown

Pattern: `^- amount: (\d+) ([A-Z]{3}), due: (\d{4}-\d{2}-\d{2}), person: ([^,]+), note: ([^,]+)(?:, status: (open|partial|paid))?(?:, rate: (\d+(?:\.\d+)?))?$`

| Segment | Matches | Capture |
|---|---|---|
| `(\d+) ([A-Z]{3})` | Amount + currency | groups 1–2 |
| `(\d{4}-\d{2}-\d{2})` | Due date | group 3 |
| `([^,]+)` | Person name (stops at comma) | group 4 |
| `([^,]+)` | Note (stops at comma) | group 5 |
| `(open\|partial\|paid)` | Optional status | group 6 |
| `(\d+(?:\.\d+)?)` | Optional rate | group 7 |

The `[^,]+` stops at comma — person names and notes cannot contain commas. This is a known limitation of the DSL.

---

## State Machine Pattern

A top-to-bottom line scanner uses an explicit state variable:

```typescript
type Section = 'none' | 'expenses' | 'income' | 'debts';

let section: Section = 'none';
let currentDate: string | null = null;

for (const [i, line] of lines.entries()) {
  if (/^## Expenses/i.test(line)) { section = 'expenses'; currentDate = null; continue; }
  if (/^## Income/i.test(line))   { section = 'income';   currentDate = null; continue; }
  if (/^## Debts/i.test(line))    { section = 'debts';    continue; }

  if (section === 'expenses' || section === 'income') {
    const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2})$/);
    if (dateMatch) { currentDate = dateMatch[1]; continue; }
  }

  if (section === 'expenses' && line.startsWith('- ')) { /* parse expense */ }
  if (section === 'income'   && line.startsWith('- ')) { /* parse income */  }
  if (section === 'debts'    && line.startsWith('- ')) { /* parse debt */    }
}
```

Blank lines and non-list lines are implicitly skipped.

---

## Map vs Array for DataStore Storage

Using `Map<string, Expense>` (keyed by `id`) instead of `Expense[]`:

| Operation | Array | Map |
|---|---|---|
| Get by ID | O(n) | O(1) |
| Delete by ID | O(n) + splice | O(1) |
| List all | O(n) `array` | O(n) `[...map.values()]` |
| Update by ID | O(n) find + mutate | O(1) set |

For personal-use ledger size (hundreds to low thousands of records), the difference is negligible. But `Map` is architecturally cleaner — no index management, no splice bugs.

---

## Pub/Sub Pattern

The DataStore uses a `Set<() => void>` for listeners:

```typescript
const listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);  // returns unsubscribe
}

function notify(): void {
  listeners.forEach(fn => fn());
}
```

`Set` (not `Array`) prevents duplicate listener registration if a component accidentally calls `subscribe` twice.

The returned unsubscribe function is a closure that captures `fn` — callers just call the returned function, no need to pass `fn` again.

---

## Frontmatter Parsing

YAML frontmatter is delimited by `---` on its own line at the start of the file:

```
---\n
key: value\n
---\n
rest of content
```

For MVP, parse only the specific keys we need:

```typescript
function parseFrontmatter(content: string): { meta: Partial<LedgerMeta>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const rawMeta = match[1];
  const body    = match[2];

  const title    = rawMeta.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const currency = rawMeta.match(/^currency:\s*(.+)$/m)?.[1]?.trim();
  const updated  = rawMeta.match(/^updated:\s*(.+)$/m)?.[1]?.trim();

  return { meta: { title, currency, updated }, body };
}
```

No full YAML parser needed — we only need three known keys.

---

## Deterministic Serialization

Canonical serialization must be idempotent: `serialize(deserialize(serialize(store))) === serialize(store)`.

Requirements:
1. Dates in expenses/income sorted **descending** (most recent first)
2. Debts sorted by `dueDate` **ascending** (soonest due first)
3. No trailing whitespace on any line
4. Single blank line between date groups
5. Double blank line between sections (i.e., `\n\n## Income`)
6. `updated` field in frontmatter set to today's date by the serializer

If these rules are followed, a file can be manually edited and re-serialized without spurious diffs.

---

## Obsidian Vault API for File I/O

```typescript
// Read
const content = await this.app.vault.read(file);

// Modify existing file
await this.app.vault.modify(file, newContent);

// Create if not exists
const existing = this.app.vault.getFileByPath(path);
if (existing) {
  await this.app.vault.modify(existing, content);
} else {
  await this.app.vault.create(path, content);
}
```

`vault.read()` and `vault.modify()` are async — always `await` them. The DataStore itself is synchronous; only the file I/O layer is async.
