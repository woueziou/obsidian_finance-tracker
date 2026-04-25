# Phase 7 — Analytics: User Stories

## Story 1 — See 6-month spending trend

**As a** user trying to understand if my spending is increasing over time,  
**I want** a line chart showing my total expenses for each of the last 6 months,  
**So that** I can spot upward trends and take action before I overspend.

**Acceptance criteria:**
- Chart shows 6 months on the x-axis (e.g., "Nov 25", "Dec 25", ..., "Apr 26")
- Y-axis shows expense totals in the configured currency
- Months with no expenses show 0 (not absent from the chart)
- Chart updates if I add expenses for a past month

---

## Story 2 — Compare income vs. expenses over time

**As a** user tracking whether I'm saving money month to month,  
**I want** a grouped bar chart showing income alongside expenses for each month,  
**So that** I can see which months I was net-positive and which I ran a deficit.

**Acceptance criteria:**
- Bar chart shows income (blue) and expenses (red) side-by-side for each of the last 6 months
- Bars are clearly labeled (legend shows Income / Expenses)
- Empty months show 0 bars (not absent)

---

## Story 3 — Know my average daily spending this month

**As a** user trying to budget day-to-day,  
**I want** to see my average daily spending for the current month,  
**So that** I can decide whether today's planned purchase is within my daily budget.

**Acceptance criteria:**
- Dashboard or analytics panel shows "Avg. daily spending: X XOF"
- Value is computed as total expenses ÷ days elapsed so far this month (not full month days)
- Updates immediately after a new expense is added

---

## Story 4 — See my top spending categories

**As a** user who wants to know where to cut back,  
**I want** to see my top 3 expense categories this month ranked by amount,  
**So that** I can focus on the categories that have the biggest impact on my budget.

**Acceptance criteria:**
- Dashboard shows ranked list: "1. food — 45,000 XOF, 2. transport — 12,000 XOF, 3. subscription — 3,000 XOF"
- Only categories with at least one expense this month appear
- Tied amounts handled deterministically (alphabetical tiebreak)

---

## Story 5 — Track debt payoff progress

**As a** user with multiple outstanding debts,  
**I want** to see a visual progress indicator for each open debt,  
**So that** I can quickly see which debts are overdue and how many I still have to settle.

**Acceptance criteria:**
- Each open or partial debt appears as a row with person name, amount, and due date
- Overdue debts are visually marked (different color or "⚠ Overdue" label)
- Paid debts are not shown
- Debts are sorted by due date ascending (soonest first)

---

## Story 6 — Analytics functions are independently testable

**As a** developer writing tests for analytics,  
**I want** all analytics functions to be pure (inputs → outputs, no side effects),  
**So that** I can test `getMonthlyTrend(store, 6)` without loading Obsidian or the plugin.

**Acceptance criteria:**
- All functions in `analytics.ts` take `store` as a parameter (not a module-level reference)
- Functions return typed values (no `any`)
- `analytics.ts` imports only from `types.ts` and `store/DataStore.ts` — no Obsidian API imports
