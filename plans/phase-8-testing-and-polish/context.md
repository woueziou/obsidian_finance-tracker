# Phase 8 — Testing & Polish: Context

## Why This Phase Exists

Every previous phase shipped working code. Phase 8 verifies that the code is correct under edge cases, removes all debug artifacts, and documents the plugin so others (or future-you) can install and use it.

This is the phase that separates a "working prototype" from a "releasable tool."

## What This Phase Covers

- Automated unit and integration tests for parsers, DataStore, and exporters
- TypeScript strict mode audit (zero `any`, zero errors)
- Debug cleanup (`console.log` removal)
- README documentation (install, DSL, export/import, settings)
- Final manual test pass in Obsidian

## What This Phase Does NOT Cover

- New features
- CI/CD setup (future)
- Community plugin submission (future)

## Inputs

- All code from Phases 1–7
- `docs/05-testing-strategy.md` — test skeletons
- Obsidian dev vault for manual testing

## Outputs

- `src/__tests__/` folder with passing tests
- Clean TypeScript build
- `README.md` complete
- Plugin ready for personal daily use

## Risk

Low-medium. The risk is discovering a fundamental flaw late (e.g., a round-trip edge case that corrupts data). If discovered in Phase 8, it must be fixed before the phase is marked complete — do not ship known data-loss bugs even for personal use.
