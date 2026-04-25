# Markdown DSL Specification

## Full File Structure

```markdown
---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---

## Expenses

### 2026-04-25
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly
- [misc] 500 XOF @ store: notebook

### 2026-04-24
- [utility] 2000 XOF: electricity bill
- [transport] 1500 XOF @ taxi: to office

## Income

### 2026-04-25
- [salary] 150000 XOF from: April freelance work

### 2026-04-20
- [donation] 50000 XOF from: uncle's gift

## Debts

- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan
- amount: 50000 XOF, due: 2026-05-15, person: Ama, note: tontine contribution, status: partial
```

---

## Expense Lines

### Grammar

```
"- [" type "] " amount " " currency (" @ " location)? ": " note
```

### Field rules

| Field | Required | Values | Example |
|---|---|---|---|
| `type` | yes | `subscription`, `food`, `misc`, `utility`, `transport` | `[food]` |
| `amount` | yes | positive integer | `15000` |
| `currency` | yes | 3-letter code | `XOF` |
| `location` | no | free text after `@` | `@ market` |
| `note` | yes | free text after `:` | `rice and vegetables` |

### Date

Date comes from the parent `### YYYY-MM-DD` heading. All expense lines under a heading share that date.

### Examples

```markdown
- [food] 15000 XOF @ market: rice and vegetables
- [subscription] 3000 XOF: Netflix monthly
- [misc] 500 XOF @ store: notebook
- [utility] 2000 XOF: electricity bill
- [transport] 1500 XOF @ taxi: to office
```

---

## Income Lines

### Grammar

```
"- [" type "] " amount " " currency " from: " source
```

### Field rules

| Field | Required | Values | Example |
|---|---|---|---|
| `type` | yes | `salary`, `donation`, `loan`, `investment`, `other` | `[salary]` |
| `amount` | yes | positive integer | `150000` |
| `currency` | yes | 3-letter code | `XOF` |
| `source` | yes | free text after `from:` | `April freelance work` |

### Examples

```markdown
- [salary] 150000 XOF from: April freelance work
- [donation] 50000 XOF from: uncle's gift
- [investment] 20000 XOF from: interest on savings
```

---

## Debt Lines

### Grammar

```
"- amount: " amount " " currency ", due: " date ", person: " name ", note: " text (", status: " status)? (", rate: " rate)?
```

### Field rules

| Field | Required | Values | Example |
|---|---|---|---|
| `amount` | yes | positive integer | `100000` |
| `currency` | yes | 3-letter code | `XOF` |
| `due` | yes | ISO 8601 date | `2026-06-01` |
| `person` | yes | free text | `Kofi` |
| `note` | yes | free text | `laptop loan` |
| `status` | no | `open`, `partial`, `paid` | `status: partial` |
| `rate` | no | decimal percentage | `rate: 5.0` |

Debts are **not** grouped under date headings — they live directly under `## Debts`.

### Examples

```markdown
- amount: 100000 XOF, due: 2026-06-01, person: Kofi, note: laptop loan
- amount: 50000 XOF, due: 2026-05-15, person: Ama, note: tontine contribution, status: partial
- amount: 200000 XOF, due: 2026-12-31, person: Bank, note: equipment loan, status: open, rate: 5.0
```

---

## Frontmatter

```yaml
---
title: Finance Ledger
currency: XOF
updated: 2026-04-25
---
```

- `currency`: default currency applied when rendering amounts
- `updated`: set by `MarkdownSerializer` on every write (today's date)

---

## Parser Behaviour Rules

1. **Section detection**: parser switches mode on `## Expenses`, `## Income`, `## Debts`
2. **Date context**: `### YYYY-MM-DD` sets current date for subsequent expense/income lines
3. **Unknown lines**: skip silently (comments, blank lines, non-list lines)
4. **Unknown types**: emit a `ParseError` with line number; continue parsing remaining lines
5. **Missing required fields**: emit `ParseError`; skip that record
6. **IDs**: assigned by DataStore on insert (not stored in markdown) — re-parsed records get new UUIDs unless matched by content hash for deduplication
7. **Serialization order**: expenses grouped by date descending, then incomes, then debts

---

## Canonical Serialization

When `MarkdownSerializer.serialize()` runs, output is always deterministic:

- Frontmatter with `updated: <today>`
- `## Expenses` section — dates sorted descending
- `## Income` section — dates sorted descending
- `## Debts` section — sorted by due date ascending
- Each line regenerated from the typed object (amounts as integers, no trailing spaces)

This means: if you parse a canonical file and re-serialize, you get the same bytes.
