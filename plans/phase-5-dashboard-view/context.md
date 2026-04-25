# Phase 5 — Dashboard View: Context

## Why This Phase Exists

After Phase 4, records can be added but there's no way to see the big picture: "How much did I spend this month? What am I spending most on? How much do I owe?" The dashboard provides that at a glance without requiring the user to open and read the raw ledger file.

## What This Phase Covers

- `src/views/DashboardView.ts` — sidebar `ItemView` with live monthly stats
- `src/views/LedgerView.ts` — table listing all records with basic filtering
- `src/views/ChartView.ts` — Chart.js wrappers (doughnut, bar, line)

## What This Phase Does NOT Cover

- Analytics beyond current month (Phase 7)
- Export UI (Phase 6)

## Inputs

- Phase 2: `DataStore` (subscriptions, aggregations)
- Phase 3: Plugin instance (register views, open views from commands)
- External: Chart.js v4 loaded from CDN at view open time

## Outputs

- Sidebar panel accessible from ribbon or command
- Shows: total expenses this month, expense breakdown chart, income this month, open debts summary
- Updates live when a record is added

## Risk

Medium. The main risks are:
1. Chart.js CDN fails (offline use) — must degrade gracefully (show numbers, hide chart)
2. Memory leak from chart instances not destroyed on view close
3. Obsidian `ItemView` lifecycle: `onOpen`/`onClose` called multiple times if the panel is hidden/shown
