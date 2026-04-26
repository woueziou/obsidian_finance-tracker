---
description: Obsidian CSS variables and DOM patterns for building views that look native — spacing grid, typography, radius, nav-item classes, list-row recipes, and grouped list layout.
---

## Spacing Grid (4px base)

| Variable | Value |
|---|---|
| `--size-4-1` | 4px |
| `--size-4-2` | 8px |
| `--size-4-3` | 12px |
| `--size-4-4` | 16px |
| `--size-4-6` | 24px |
| `--size-4-9` | 36px |
| `--size-4-18` | 72px |

Always use multiples of 4px. Do not invent arbitrary values.

## Typography Variables

| Variable | Typical use |
|---|---|
| `--font-ui-smaller` | labels, badges, metadata |
| `--font-ui-small` | secondary text, filter chips |
| `--font-ui-medium` | body / default UI text |
| `--font-smallest` | very fine print, tooltips |
| `--font-smaller` | slightly below normal |
| `--font-normal` | weight 400 |
| `--font-semibold` | weight 500–600 |
| `--font-bold` | weight 700 |

## Radius Variables

| Variable | Shape |
|---|---|
| `--radius-s` | small inputs, badges |
| `--radius-m` | cards, panels |
| `--radius-l` | modals, floating |
| `--radius-xl` | large containers |

## Nav / Tree CSS Classes

| Class | Description |
|---|---|
| `nav-folder` | Collapsible folder container |
| `nav-folder-title` | Folder row — usually uppercase muted label |
| `nav-file` | File-level row container |
| `nav-file-title` | Clickable file name row |
| `tree-item` | Generic tree row container |
| `tree-item-self` | The clickable row inside `tree-item` |
| `tree-item-inner` | Text content inside `tree-item-self` |
| `tree-item-flair` | Right-side badge/count inside a tree row |
| `search-result-file-title` | Bold heading row in search-results style lists |
| `search-result-file-match` | Secondary match/detail row below a heading |

## Nav Item CSS Variables

| Variable | Use |
|---|---|
| `--nav-item-size` | font-size for nav rows |
| `--nav-item-padding` | padding inside nav rows |
| `--nav-item-color` | default text colour |
| `--nav-item-color-hover` | text colour on hover |
| `--nav-item-background-hover` | row bg on hover |
| `--nav-item-background-active` | row bg when selected/active |
| `--nav-heading-color` | muted colour for section headings |
| `--nav-heading-weight` | font-weight for section headings |

## Recipe: Two-line List Row

```typescript
const row = listEl.createEl('div', { cls: 'tree-item-self' });

// Line 1 — primary + right badge (flex space-between)
const line1 = row.createEl('div', { cls: 'fl-expense-line1' });
line1.createEl('span', { text: primaryText, cls: 'tree-item-inner' });
line1.createEl('span', { text: badgeText, cls: 'tree-item-flair fl-type-badge fl-type-badge--food' });

// Line 2 — note + amount (flex space-between)
const line2 = row.createEl('div', { cls: 'fl-expense-line2' });
line2.createEl('span', { text: note, cls: 'fl-expense-note' });
line2.createEl('span', { text: amount, cls: 'fl-expense-amount' });
```

## Recipe: Grouped List (date section headers)

```typescript
// Group expenses by date, then iterate groups descending
const groups = new Map<string, Expense[]>();
for (const e of sorted) {
  (groups.get(e.date) ?? groups.set(e.date, []).get(e.date)!).push(e);
}

for (const [date, items] of groups) {
  listEl.createEl('div', { text: formatDateLabel(date), cls: 'fl-date-section-header' });
  for (const e of items) {
    renderExpenseRow(listEl, e);
  }
}
```

Use `createEl` from Obsidian's `HTMLElement` extensions — never `document.createElement` inside views.

## Gotchas

- `tree-item-flair` expects to be a direct child of `tree-item-self` for correct flex alignment.
- `nav-folder-title` already has padding from Obsidian's base CSS — adding extra padding doubles it unless you reset first.
- `--nav-item-background-hover` is not set in all themes; fall back to `var(--background-modifier-hover)`.
- `search-result-file-match` has a left indent baked in; only use it when you want that indent.

## Avoid

- Hard-coding pixel values that aren't multiples of 4.
- Using `document.createElement` — use `el.createEl()` so Obsidian tracks the element lifecycle.
- Applying `nav-file` / `nav-folder` classes to arbitrary divs — they carry global margin/padding rules that break non-sidebar layouts.
- Mixing `tree-item` classes with flex containers that don't expect their built-in display model.
