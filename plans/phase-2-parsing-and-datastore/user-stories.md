# Phase 2 — Parsing & DataStore: User Stories

## Story 1 — Parse a valid expense section

**As a** developer loading the ledger file on plugin startup,  
**I want** `parseExpenses` to convert well-formed markdown lines into `Expense` objects,  
**So that** the DataStore is populated from the file without manual data entry.

**Acceptance criteria:**
- Input: multi-line string with `## Expenses`, `### 2026-04-25`, and valid `- [food] ...` lines
- Output: array of `Expense` objects with correct `date`, `amount` (in cents), `type`, `note`, `location`
- `location` is `undefined` when `@ location` segment is absent
- Each object passes `ExpenseSchema.parse()`

---

## Story 2 — Parser collects errors without stopping

**As a** user who manually edited the ledger and made a typo on one line,  
**I want** the parser to recover from that line and continue parsing the rest,  
**So that** a single bad line doesn't wipe out all other valid records on startup.

**Acceptance criteria:**
- A line with an unknown type (e.g., `[luxury]`) produces a `ParseError` entry
- Remaining valid lines in the file are still parsed correctly
- `ParseResult.errors` contains exactly one error for the bad line, with the line number and raw text

---

## Story 3 — Parse all three record types from a full ledger file

**As a** developer implementing `MarkdownSerializer.deserialize()`,  
**I want** a single call that returns expenses, incomes, and debts from a complete ledger file,  
**So that** I only need one function call at startup, not three.

**Acceptance criteria:**
- `deserialize(content)` returns `ParseResult` with all three arrays populated
- Frontmatter `currency` and `title` are parsed into `meta`
- Sections that are absent from the file produce empty arrays (no error)

---

## Story 4 — Add a record and retrieve it immediately

**As a** developer implementing `AddExpenseModal`,  
**I want** to call `store.addExpense(input)` and immediately call `store.getExpenses()` and see the new record,  
**So that** the UI can re-render without waiting for a file write.

**Acceptance criteria:**
- `store.addExpense(validInput)` returns the created `Expense` with an assigned `id`
- `store.getExpenses()` includes that record immediately after
- `store.getExpensesByDate('2026-04-25')` returns only expenses for that date

---

## Story 5 — Dashboard subscribes and receives live updates

**As a** user viewing the dashboard,  
**I want** the totals to update the moment I add an expense from a modal,  
**So that** I don't need to refresh or reopen the panel.

**Acceptance criteria:**
- `store.subscribe(listener)` registers a callback
- Calling `store.addExpense()` fires the listener synchronously
- The returned unsubscribe function, when called, stops future notifications
- If a listener throws, other listeners still execute (use try/catch in `notify()`)

---

## Story 6 — Serialize DataStore to canonical markdown

**As a** developer saving the ledger after a record is added,  
**I want** `MarkdownSerializer.serialize(store, meta)` to produce valid markdown in canonical form,  
**So that** the ledger file stays readable and diff-friendly in Git.

**Acceptance criteria:**
- Output contains `## Expenses`, `## Income`, `## Debts` sections
- Expenses grouped under `### YYYY-MM-DD` headings sorted descending by date
- Debts sorted ascending by `dueDate`
- `updated` field in frontmatter equals today's date
- No trailing whitespace on any line
- Calling `serialize` twice on the same store produces identical output

---

## Story 7 — Round-trip produces identical records

**As a** developer verifying the serializer,  
**I want** `deserialize(serialize(store, meta)).ledger.expenses` to equal `store.getExpenses()` field-by-field (excluding `id` which is re-generated),  
**So that** I know no data is lost in the markdown representation.

**Acceptance criteria:**
- `amount`, `date`, `currency`, `type`, `note`, `location` match exactly after round-trip
- Test passes for all three record types

---

## Story 8 — External file changes prompt a reload

**As a** user who edits the ledger file in another app (e.g., via Git sync),  
**I want** Obsidian to notify me that the file changed and offer to reload,  
**So that** my in-memory DataStore doesn't silently diverge from the file on disk.

**Acceptance criteria:**
- `FileWatcher` fires `onExternalChange` when `finance-ledger.md` is modified externally
- `FileWatcher` does NOT fire `onExternalChange` when the plugin writes the file itself
- Notification is debounced — rapid successive external changes produce one callback, not many
