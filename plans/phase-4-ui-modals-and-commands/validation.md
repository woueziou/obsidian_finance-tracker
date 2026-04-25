# Phase 4 — UI Modals & Commands: Validation Checklist

---

## Build

- [ ] `tsc --noEmit --strict` clean on all files in `src/commands/`
- [ ] No `any` in any command file

---

## Add Expense Modal (manual test in Obsidian)

- [ ] Modal opens when ribbon button is clicked
- [ ] Modal opens when "Finance Tracker: Add Expense" command is triggered
- [ ] Date field is pre-filled with today's date (`YYYY-MM-DD`)
- [ ] All fields are present: date, amount, type, note, location
- [ ] Type dropdown contains exactly: food, subscription, misc, utility, transport
- [ ] Submitting all valid fields shows "Expense added!" Notice
- [ ] Modal closes after successful submit
- [ ] New line appears in `finance-ledger.md` under today's date in `## Expenses`
- [ ] Amount is stored as cents (verify: `15000` in form → ledger shows `15000`, DataStore has `1500000`)

---

## Add Income Modal (manual test)

- [ ] Modal opens from ribbon and command palette
- [ ] Fields present: date, amount, type, source, note
- [ ] Type dropdown contains: salary, donation, loan, investment, other
- [ ] Successful submit shows Notice and closes modal
- [ ] New line appears in `## Income` with correct `from:` source text

---

## Add Debt Modal (manual test)

- [ ] Modal opens from ribbon and command palette
- [ ] Fields present: amount, due date, person, note, status, interest rate (optional)
- [ ] Status dropdown defaults to `open`
- [ ] Interest rate field accepts decimal values (e.g., `5.0`)
- [ ] Successful submit shows Notice and closes modal
- [ ] New line appears in `## Debts`

---

## Validation Behaviour

- [ ] Submitting empty expense form shows error message in modal (modal stays open)
- [ ] Submitting with missing `note` shows error about `note`
- [ ] Submitting with non-numeric `amount` (`abc`) shows error about `amount`
- [ ] Submitting with date in wrong format (`25/04/2026`) shows date error
- [ ] Negative amount shows error
- [ ] After fixing errors and resubmitting, submit succeeds

---

## Keyboard Accessibility

- [ ] Enter key in modal triggers submit
- [ ] Escape key closes the modal without saving

---

## File Write

- [ ] After successful submit, ledger file is updated within 2 seconds
- [ ] Multiple rapid submits (adding 3 expenses quickly) all appear in the file
- [ ] Opening the ledger file immediately after submit shows the new record

---

## Phase Exit Criteria

- [ ] All three modals open from ribbon buttons and command palette
- [ ] All three modals submit successfully with valid data
- [ ] All three modals show errors for invalid data
- [ ] All added records appear in `finance-ledger.md`
- [ ] `tsc --noEmit --strict` clean
