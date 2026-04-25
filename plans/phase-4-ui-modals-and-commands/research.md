# Phase 4 — UI Modals & Commands: Research

## Obsidian Modal API

```typescript
class MyModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    // Build UI here. contentEl is available.
    this.contentEl.createEl('h2', { text: 'My Title' });
  }

  onClose(): void {
    // Clean up DOM here.
    this.contentEl.empty();
  }
}

// Open from anywhere:
new MyModal(app).open();
```

`contentEl` is a `HTMLDivElement` inside the modal. Use `createEl()` for DOM creation — it's Obsidian's type-safe wrapper around `document.createElement`.

---

## Obsidian Setting API

`Setting` is Obsidian's form row builder. Each row has a name, optional description, and one or more controls.

```typescript
new Setting(containerEl)
  .setName('Field label')
  .setDesc('Helper text shown below the label')
  .addText(text => {
    text
      .setPlaceholder('hint text')
      .setValue('initial value')
      .onChange((value: string) => { /* handle change */ });
  });
```

Other control types:
```typescript
.addDropdown(drop => {
  drop
    .addOptions({ key: 'Display Label', ... })  // adds all at once
    .setValue('key')
    .onChange((value: string) => { ... });
})

.addToggle(toggle => {
  toggle.setValue(true).onChange((value: boolean) => { ... });
})

.addButton(btn => {
  btn.setButtonText('Submit').setCta().onClick(() => { ... });
})
```

`.setCta()` applies the primary button style (blue background).

---

## Zod `safeParse` for Form Validation

```typescript
const result = MySchema.safeParse(formData);

if (!result.success) {
  // result.error is ZodError
  result.error.issues.forEach(issue => {
    console.log(issue.path, issue.message);
    // issue.path is string[] — the field path, e.g. ['amount']
  });
  return;
}

// result.data is the validated, typed object
const validated = result.data;
```

For a flat object (no nested fields), `issue.path[0]` is the field name.

---

## Displaying Validation Errors in the Modal

Two approaches:

**Approach A — Single error paragraph** (simple, good for MVP):
```typescript
const errorEl = contentEl.createEl('p', { cls: 'finance-tracker-error' });
// On submit failure:
errorEl.textContent = result.error.issues.map(i => i.message).join(', ');
```

**Approach B — Per-field error spans** (better UX, more code):
Create a `<span>` below each field's `Setting` and populate it when the corresponding `issue.path[0]` matches the field name.

MVP uses Approach A. Approach B can be added in Phase 8 polish if needed.

---

## Form State Management

The modal stores partial form data in a plain object:

```typescript
private formData: {
  date?: string;
  amount?: number;
  type?: ExpenseType;
  note?: string;
  location?: string;
} = {};
```

On `onOpen()`, set defaults (e.g., today's date). On submit, pass the object to `safeParse`. Zod will report all missing required fields at once.

Do not initialize `amount` to `0` — `0` is falsy and would pass `typeof` checks but fail Zod's `.positive()`. Leave it `undefined` and let Zod catch it.

---

## Obsidian DOM Helpers

```typescript
// createEl(tag, options)
const heading = el.createEl('h2', { text: 'Title' });
const para    = el.createEl('p',  { cls: 'my-class', text: 'Some text' });

// Equivalent to:
const heading = document.createElement('h2');
heading.textContent = 'Title';
el.appendChild(heading);
```

Prefer `createEl` over raw `document.createElement` — it's type-safe and automatically appends to the parent element.

---

## Closing the Modal After Submit

```typescript
this.close();
```

This triggers `onClose()` and removes the modal from the DOM. Call it after a successful submit.

---

## Keyboard Accessibility

Obsidian modals support standard keyboard navigation. To make the submit button respond to Enter:

```typescript
this.scope.register([], 'Enter', () => this.handleSubmit());
```

`this.scope` is a `Scope` instance provided by the `Modal` base class. Register key handlers in `onOpen()`.

---

## Input Parsing: Amount Field

The user types `15000`. The stored value should be `1500000` (cents).

```typescript
.onChange(v => {
  const parsed = parseInt(v.replace(/\s/g, ''), 10);
  this.formData.amount = isNaN(parsed) ? undefined : parsed * 100;
})
```

`replace(/\s/g, '')` handles inputs like `15 000` (French-locale number format with space separator).
