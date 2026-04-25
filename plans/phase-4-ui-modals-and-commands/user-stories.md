# Phase 4 — UI Modals & Commands: User Stories

## Story 1 — Add an expense in under 10 seconds

**As a** user who just bought lunch at the market,  
**I want** to click the wallet ribbon button, fill in the amount and type, and hit submit,  
**So that** the expense is recorded without me opening the ledger file manually.

**Acceptance criteria:**
- Clicking the ribbon button opens a modal with: date (pre-filled with today), amount, type dropdown, note, optional location
- Submitting a valid form closes the modal and shows "Expense added!"
- The ledger file is updated within 2 seconds
- The new expense line appears correctly in `finance-ledger.md`

---

## Story 2 — Add income from a client payment

**As a** freelancer who just received payment,  
**I want** to open "Add Income" and record the amount with source and type,  
**So that** my monthly income total stays accurate without manual markdown editing.

**Acceptance criteria:**
- Income modal has: date, amount, type dropdown (salary/donation/loan/investment/other), source (required), note
- Submitting adds the income to the DataStore and schedules a file write
- The income line appears in the `## Income` section with the correct `from:` source text

---

## Story 3 — Add a debt with a due date

**As a** user who lent money to a friend,  
**I want** to open "Add Debt" and specify the person, amount, and due date,  
**So that** I don't forget who owes me and when it's due.

**Acceptance criteria:**
- Debt modal has: amount, due date, person, note, status dropdown (defaults to open), optional interest rate
- Submitting adds the debt to the DataStore
- Debt line appears in `## Debts` section with correct format

---

## Story 4 — Validation blocks empty required fields

**As a** user who accidentally clicked submit without filling the amount,  
**I want** to see an error message in the form, not have the app crash,  
**So that** I understand what I missed and can correct it.

**Acceptance criteria:**
- Submitting with empty `amount` shows error: "amount: Required" or similar
- Submitting with empty `note` shows an error
- Modal stays open after a failed submit
- Error message clears when user corrects the field and resubmits

---

## Story 5 — Validation blocks invalid values

**As a** user who typed text in the amount field,  
**I want** the form to reject non-numeric input before writing to the file,  
**So that** the ledger file never contains garbage data.

**Acceptance criteria:**
- Typing `abc` in the amount field → submit shows error about invalid amount
- Typing `-500` → submit shows error (negative amount not allowed)
- Typing a date in wrong format (`25/04/2026`) → submit shows error about date format

---

## Story 6 — Commands work from the command palette

**As a** user who prefers keyboard over mouse,  
**I want** all three add-record commands available in Ctrl+P,  
**So that** I can add an expense without moving my hands off the keyboard.

**Acceptance criteria:**
- "Finance Tracker: Add Expense" opens `AddExpenseModal`
- "Finance Tracker: Add Income" opens `AddIncomeModal`
- "Finance Tracker: Add Debt" opens `AddDebtModal`
- Pressing Enter inside the modal submits the form (keyboard accessible)

---

## Story 7 — Currency is shown in the amount field hint

**As a** user who configured XOF as the default currency,  
**I want** the amount field to show "Enter whole number in XOF",  
**So that** I don't accidentally enter a value thinking it's EUR or USD.

**Acceptance criteria:**
- Amount field description reads "Enter whole number in [currency from settings]"
- Changing currency in settings and reopening the modal shows the updated currency
