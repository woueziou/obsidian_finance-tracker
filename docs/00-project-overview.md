# Obsidian Finance Tracker — Project Overview

## What It Is

A TypeScript-based Obsidian plugin for personal finance tracking. Data lives entirely in a human-readable markdown ledger file inside the user's vault — no cloud, no external APIs, no subscriptions.

## Target User

Solo developer/freelancer in West Africa (Togo) tracking daily expenses, income, and debts. Key workflows:

- Record and categorize daily spending (food, transport, utility, etc.)
- Track freelance income from multiple sources
- Monitor debts and tontine contributions with due dates
- Export data to CSV/JSON/SQL for external analysis or tax records

## Core Value Propositions

1. **Fully local** — data never leaves the vault
2. **Markdown-first** — ledger is human-readable, Git-friendly
3. **Zero ongoing cost** — no SaaS, no API keys
4. **Obsidian-native** — integrates with existing note-taking workflow

## Technology Choices

| Concern | Choice | Reason |
|---|---|---|
| Language | TypeScript strict | Type safety, Obsidian ecosystem |
| Validation | Zod | Zero-dep, composable schemas |
| Parsing | Custom regex + state machine | No parser-generator overhead |
| Storage | Obsidian Vault API | Native file abstraction |
| Charts | Chart.js via CDN | Lazy-loaded, no npm bloat |
| Build | esbuild | Obsidian sample plugin default |

## Amount & Date Conventions

- **Amounts stored in cents** (integers) — avoids float precision issues
- **Dates stored as ISO 8601** (`YYYY-MM-DD`) — unambiguous, sortable
- **IDs via `crypto.randomUUID()`** — deduplication on import

## Document Index

| Doc | Contents |
|---|---|
| `01-phases.md` | 8-phase execution plan with deliverables |
| `02-architecture.md` | Module map, data flow, dependency graph |
| `03-markdown-dsl.md` | Full DSL spec with examples |
| `04-data-models.md` | TypeScript interfaces + Zod schemas reference |
| `05-testing-strategy.md` | Unit + integration test plan |
| `06-implementation-notes.md` | Edge cases, performance constraints, gotchas |
