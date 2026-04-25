# Phase 7 — Analytics: Context

## Why This Phase Exists

The dashboard (Phase 5) shows current-month stats. Phase 7 expands the time horizon: trends over multiple months, category benchmarks, and debt payoff projections. This is the "insight" layer that turns raw records into actionable intelligence.

## What This Phase Covers

- `src/utils/analytics.ts` — all aggregation functions
- Extended charts in `ChartView.ts`: 6-month trend, income vs expense comparison, debt progress bars
- A dedicated analytics view or expanded dashboard panel

## What This Phase Does NOT Cover

- New data entry flows
- Export of analytics results (charts are visual only)
- Machine-learning forecasting (noted as future extension)

## Inputs

- Phase 2: `DataStore` (all records, filtered by date range)
- Phase 5: `ChartView.ts` (existing chart infrastructure)
- Phase 1: Type definitions

## Outputs

- `analytics.ts` — pure functions for computing metrics
- Extended views with multi-month charts

## Priority

This phase is marked LOW priority. It should be completed only after Phases 1–6 are fully working and tested. Skip if time is limited.

## Risk

Low. Pure computation, no new APIs. The only risk is computing monthly aggregates incorrectly for months with sparse data (empty months should show 0, not be skipped).
