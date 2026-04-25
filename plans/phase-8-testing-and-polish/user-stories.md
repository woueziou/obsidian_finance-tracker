# Phase 8 — Testing & Polish: User Stories

## Story 1 — Parser edge cases are covered by tests

**As a** developer maintaining the plugin,  
**I want** automated tests that cover invalid markdown input for the expense, income, and debt parsers,  
**So that** I can refactor the parsers confidently without breaking edge-case handling.

**Acceptance criteria:**
- `expenseParser.test.ts` has tests for: valid line, missing location, unknown type, note with colon, line before date heading
- `debtParser.test.ts` has tests for: all fields present, missing `person`, invalid due date, default status
- All tests pass with `bun test` or `npm test`

---

## Story 2 — DataStore pub/sub is tested automatically

**As a** developer who changed the notification logic in DataStore,  
**I want** a test that verifies subscribers are called on `addExpense` and not called after `unsubscribe()`,  
**So that** I know the pub/sub system works without having to open Obsidian and verify manually.

**Acceptance criteria:**
- `DataStore.test.ts` has a test that adds a listener, calls `addExpense`, and asserts the listener was called
- The test asserts the listener is NOT called after `unsubscribe()` is called
- Test passes

---

## Story 3 — CSV escaping is verified automatically

**As a** developer who ships an export feature,  
**I want** unit tests for the `csvField()` function covering notes with commas and double quotes,  
**So that** I know the escaping is correct before a user opens the file in Excel and sees garbled data.

**Acceptance criteria:**
- Test: `csvField('rice, beans')` → `"rice, beans"` (comma triggers wrapping)
- Test: `csvField('uncle"s gift')` → `"uncle""s gift"` (double-quote escaped)
- Both tests pass

---

## Story 4 — Round-trip data integrity is verified automatically

**As a** developer who changed the serializer,  
**I want** an integration test that parses a canonical ledger, serializes it, and checks that no data changed,  
**So that** a serializer bug is caught before it silently corrupts the user's ledger file.

**Acceptance criteria:**
- `roundTrip.test.ts` contains the full round-trip test for all three record types
- Test compares all fields except `id` (which is regenerated)
- Test verifies `serialize(serialize(x)) === serialize(x)` (idempotent)
- Test passes

---

## Story 5 — TypeScript compiles with zero errors

**As a** developer preparing to use the plugin in production,  
**I want** `tsc --noEmit --strict` to exit with zero errors on the entire `src/` folder,  
**So that** I know there are no type holes that could cause runtime errors.

**Acceptance criteria:**
- `npm run type-check` (or `bun run type-check`) exits with code 0
- Zero uses of `any` in `src/` (verified by grep)
- Zero TypeScript `enum` keywords (verified by grep)

---

## Story 6 — No debug logs in production code

**As a** user who keeps the developer console open,  
**I want** the plugin to not log anything to the console during normal use,  
**So that** I'm not distracted by debug output from the plugin in my console.

**Acceptance criteria:**
- `grep -rn 'console\.log' src/` returns no matches
- `grep -rn 'console\.warn' src/` returns only deliberate, prefixed warnings like `[Finance Tracker] Chart.js...`
- Plugin runs silently in normal use

---

## Story 7 — README explains the DSL with copy-paste examples

**As a** user who wants to manually add records to the ledger file,  
**I want** the README to show me the exact format for expense, income, and debt lines,  
**So that** I can edit the file directly and know it will parse correctly.

**Acceptance criteria:**
- README contains a "Markdown DSL Reference" section
- Each record type has a documented format and at least one full example
- Examples are inside fenced code blocks (copy-paste ready)
- README explains the `@ location` and `from:` optional/required fields

---

## Story 8 — Plugin survives a full 12-step manual test

**As a** user installing the plugin for daily use,  
**I want** the plugin to pass a documented end-to-end test sequence in a clean vault,  
**So that** I'm confident there are no startup crashes, data loss, or silent failures before I start using it for real finances.

**Acceptance criteria:**
- All 12 steps in the manual test sequence in `implementation.md` pass without errors
- No unexpected Notices appear
- No errors in the developer console during the test sequence
