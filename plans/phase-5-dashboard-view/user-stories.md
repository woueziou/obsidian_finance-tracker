# Phase 5 — Dashboard View: User Stories

## Story 1 — See monthly expense total at a glance

**As a** user who wants to know if I'm overspending,  
**I want** to open the Finance Dashboard and immediately see this month's total expenses,  
**So that** I can make a spending decision without manually summing entries in the ledger.

**Acceptance criteria:**
- Dashboard panel opens from ribbon button or command palette
- Shows current month name and year as the panel heading
- Shows total expenses for the current month, formatted in configured currency (e.g., `45 000 XOF`)
- Total is correct (matches sum of all expenses in the current month)

---

## Story 2 — See expense breakdown by category

**As a** user who wants to know where my money goes,  
**I want** a chart showing the proportion of expenses by type (food, transport, etc.),  
**So that** I can quickly identify my highest-spending category.

**Acceptance criteria:**
- Dashboard shows a doughnut/pie chart when there are expenses this month
- Chart labels match expense types that have a non-zero amount
- Chart renders without errors in Obsidian's webview
- If Chart.js fails to load (offline), numbers are still shown without the chart

---

## Story 3 — See income vs. balance summary

**As a** user tracking both income and expenses,  
**I want** to see income this month alongside expenses and the resulting balance,  
**So that** I know at a glance whether I'm net-positive or net-negative this month.

**Acceptance criteria:**
- Dashboard shows: Expenses, Income, Balance (income − expenses) as stat cards
- Balance is negative (red or clearly negative) when expenses exceed income
- Balance is positive (green or clearly positive) when income exceeds expenses

---

## Story 4 — See open debts summary

**As a** user managing multiple informal debts,  
**I want** the dashboard to show the count and total amount of open debts,  
**So that** I have a constant reminder of what's outstanding.

**Acceptance criteria:**
- Dashboard shows count of open (or partial) debts
- If there are no open debts, the stat card shows `0`

---

## Story 5 — Dashboard updates live after adding a record

**As a** user who just added an expense via the modal,  
**I want** the dashboard totals to update immediately without closing and reopening the panel,  
**So that** I can add expenses quickly and see the running total update in real time.

**Acceptance criteria:**
- Adding an expense via modal updates the dashboard expense total within 500ms
- Chart re-renders with the new category distribution
- No duplicate entries appear in the chart

---

## Story 6 — Dashboard is accessible from ribbon and command palette

**As a** user who works keyboard-first,  
**I want** "Finance Tracker: Open Dashboard" in the command palette,  
**So that** I can open the dashboard without touching the ribbon.

**Acceptance criteria:**
- Command "Finance Tracker: Open Dashboard" opens the dashboard panel
- If the panel is already open, the command brings it into focus
- Ribbon icon `bar-chart-2` also opens the dashboard

---

## Story 7 — Quick-add buttons in the dashboard

**As a** user viewing the dashboard,  
**I want** "+ Expense", "+ Income", "+ Debt" buttons inside the panel,  
**So that** I can add a record without navigating back to the ribbon.

**Acceptance criteria:**
- Three buttons are visible in the dashboard panel
- Each opens the correct modal
- After adding a record from inside the dashboard, the dashboard updates automatically
