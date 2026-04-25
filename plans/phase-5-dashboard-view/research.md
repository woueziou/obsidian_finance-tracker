# Phase 5 — Dashboard View: Research

## Obsidian ItemView API

`ItemView` is the base class for custom panels in Obsidian (sidebar leaves, main area tabs):

```typescript
class MyView extends ItemView {
  getViewType(): string { return 'my-view-type'; }   // unique string ID
  getDisplayText(): string { return 'My Panel'; }    // tab title
  getIcon(): string { return 'icon-name'; }          // Lucide icon

  async onOpen(): Promise<void> {
    // Build UI into this.containerEl
  }

  async onClose(): Promise<void> {
    // Clean up (destroy charts, unsubscribe, etc.)
  }
}
```

`this.containerEl` is the writable area inside the panel. Always call `containerEl.empty()` at the start of `render()` to avoid DOM accumulation.

---

## Registering and Opening a View

```typescript
// Register (in onload):
this.registerView('my-view-type', (leaf) => new MyView(leaf, this));

// Open / reveal:
const existing = this.app.workspace.getLeavesOfType('my-view-type');
if (existing.length === 0) {
  const leaf = this.app.workspace.getRightLeaf(false);
  await leaf.setViewState({ type: 'my-view-type', active: true });
}
this.app.workspace.revealLeaf(
  this.app.workspace.getLeavesOfType('my-view-type')[0]
);
```

`getRightLeaf(false)` gets an existing right sidebar leaf without creating a new split. Use `getLeaf(true)` to force a new split if none exists.

---

## Chart.js v4 — Key Concepts

Chart.js 4 is loaded as a UMD bundle. After loading, `window.Chart` is the constructor.

### Doughnut chart
```javascript
new Chart(canvas, {
  type: 'doughnut',
  data: {
    labels: ['Food', 'Transport', 'Subscription'],
    datasets: [{
      data: [45000, 12000, 3000],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }]
  },
  options: { responsive: true }
});
```

### Bar chart
```javascript
new Chart(canvas, {
  type: 'bar',
  data: {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      { label: 'Income',   data: [...], backgroundColor: '#36A2EB' },
      { label: 'Expenses', data: [...], backgroundColor: '#FF6384' },
    ]
  }
});
```

### Destroying charts
```javascript
chart.destroy(); // must be called before removing the canvas element
```

Failing to destroy leads to: "Canvas is already in use" errors on re-render.

---

## TypeScript: Typing `window.Chart`

Chart.js is not in `package.json`, so TypeScript doesn't know about `window.Chart`. Declare it:

```typescript
declare global {
  interface Window {
    Chart: typeof import('chart.js').Chart;
  }
}
```

Or use a type-safe cast where needed:

```typescript
const ChartConstructor = (window as Window & { Chart?: typeof Chart }).Chart;
if (ChartConstructor) {
  const chart = new ChartConstructor(canvas, config);
}
```

For MVP, the second approach avoids adding `@types/chart.js` to devDependencies.

---

## Currency Formatting in Dashboard

```typescript
function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('fr-TG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${amount.toLocaleString()} ${currency}`;
  }
}
```

The `try/catch` handles currencies not recognized by `Intl` (e.g., typos in settings).

---

## Obsidian Sidebar Behavior

- The right sidebar can hold multiple leaves stacked vertically
- A view can be docked (always visible) or appear as a tab
- `workspace.revealLeaf(leaf)` scrolls to and activates the leaf if it's off-screen or behind another tab
- `onClose` is called when the leaf is closed (user clicks X), not when another tab is shown

---

## Avoiding DOM Accumulation

`render()` is called every time the DataStore changes. If it appends to `containerEl` without clearing it first, the panel fills with duplicates.

Pattern:
```typescript
private async render(): Promise<void> {
  // Destroy existing charts first (before clearing DOM)
  this.chartInstances.forEach(c => c.destroy());
  this.chartInstances = [];

  this.containerEl.empty(); // then clear DOM

  // ... rebuild UI
}
```

Destroying charts before `empty()` is critical — Chart.js holds a reference to the canvas element. If the canvas is removed first, `chart.destroy()` may error.
