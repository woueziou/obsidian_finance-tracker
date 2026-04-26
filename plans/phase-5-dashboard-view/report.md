# Phase 5 — Dashboard View: Report

## What Was Built

### Files Created
- `src/views/DashboardView.ts` — `ItemView` sidebar panel. Shows monthly stats (expenses, income, balance, open-debt count) in a 2x2 stat grid. Loads Chart.js v4 lazily from CDN on first open; renders a doughnut chart of expense breakdown by type when data exists. Subscribes to `DataStore` for live updates; destroys all chart instances before each re-render and on close. Quick-add buttons for Expense, Income, and Debt trigger the existing modals.
- `src/views/LedgerView.ts` — `ItemView` panel showing all expenses in a filterable table. Filter controls: type dropdown and date-range inputs. Table shell is built once in `buildShell()`; `renderTable()` re-renders only the tbody on every data change or filter change. Subscribed to DataStore; unsubscribes on close.

### Files Modified
- `src/store/DataStore.ts` — added `getMonthlyIncomeTotal(year, month)` and `getOpenDebts()` aggregation methods.
- `src/main.ts` — registered `DashboardView` and `LedgerView` via `this.registerView()`; added `activateDashboard()` method; added "Open Dashboard" command; added `bar-chart-2` ribbon icon for the dashboard.
- `tsconfig.json` — added `"DOM"` to `lib` array. Required because `DashboardView.loadChartJs()` uses `document.createElement` and `document.head.appendChild` to lazy-load Chart.js, and the `window` global is needed for the CDN-loaded Chart constructor. The Obsidian plugin runs in Electron (a browser context), so DOM types are correct to include.
- `styles.css` — added `.finance-stats-grid`, `.finance-stat-card`, `.finance-stat-label`, `.finance-stat-value`, `.finance-btn-row` for the dashboard, and `.finance-ledger-controls`, `.finance-ledger-filter`, `.finance-ledger-table`, `.finance-ledger-empty` for the ledger view.

## Decisions Made

- **`tsconfig.json` lib addition** — not in the original plan. Added `"DOM"` because `loadChartJs()` needs `document.createElement` and `window` for the CDN-loaded Chart constructor. None of the previous phases used these directly (they went through Obsidian's `createEl` abstraction), but Chart.js lazy-loading requires raw DOM access. This is correct for an Obsidian plugin since it always runs in Electron.
- **Local Chart.js type declarations** — instead of adding `@types/chart.js` as a dev dependency or using `declare global { interface Window { Chart: ... } }`, I declared minimal local interfaces (`ChartInstance`, `ChartConstructor`, etc.) and used a type-safe cast `(window as Window & { Chart?: ChartConstructor }).Chart`. This keeps the dependency surface small and compiles cleanly.
- **LedgerView shell/table split** — the shell (header, filter controls, table container div) is built once in `buildShell()`; `renderTable()` replaces only the contents of the `#finance-ledger-table-container` div. This preserves filter control state across re-renders without needing to re-read DOM values.
- **Chart only renders non-zero types** — `getExpenseSummaryByType` returns all five types including zeroes. DashboardView filters to `nonZeroTypes` before passing to Chart.js, so the chart does not include empty-label slices.

## Known Issues / Deferred Items

- All runtime validation (chart rendering, live updates, offline fallback, memory leak) requires manual testing inside Obsidian. The automated gate is `tsc --noEmit --strict`.
- `LedgerView` only shows expenses. Income and debt tables are deferred to Phase 7 (analytics) or Phase 8 (polish).
- No visual indicator (colour) for negative balance. The plan mentions "clearly negative" but CSS colour-coding is deferred to Phase 8.
- The `querySelector` call in `renderTable()` relies on an `id` attribute set in `buildShell()`. If Obsidian reuses the container element between view openings without calling `onClose`/`onOpen`, the container div may not be present. In practice Obsidian always calls `onClose` before reusing a leaf, so this is safe.

## Context for Next Phase

### Phase 6 — Export/Import
- `DashboardView` and `LedgerView` are registered and functional. No export UI is wired in yet.
- `plugin.store.getExpenses()`, `getIncomes()`, `getDebts()` are the data access methods exporters should use.
- `plugin.settings.exportDirectory` is the configured output path for export files.
- The `"DOM"` lib addition in tsconfig means file/Blob/URL APIs are now available in TypeScript for export implementations (e.g., `URL.createObjectURL`). However, Obsidian's vault API should be preferred over browser download APIs for writing to the vault.
