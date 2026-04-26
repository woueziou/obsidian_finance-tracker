---
description: Correct async onload/onunload patterns, field guard idioms, and Obsidian auto-cleanup contracts for plugin lifecycle methods.
---

## API / Patterns

| Pattern | Correct usage |
|---|---|
| Declare lifecycle methods | `override async onload(): Promise<void>` — `override` is required in strict TS when parent declares the method |
| Declare unload method | `override async onunload(): Promise<void>` — also async if any async cleanup is needed |
| Guard fields assigned in onload | Use `private fileWatcher!: FileWatcher` for the type, but always access as `this.fileWatcher?.destroy()` in `onunload` — `onload` may have thrown before assignment |
| Register vault/workspace events | `this.registerEvent(vault.on('modify', cb))` — Obsidian auto-unregisters on plugin unload; never call `vault.on()` and discard the `EventRef` |
| Register ribbon icons | `this.addRibbonIcon(icon, title, cb)` — auto-cleaned on unload |
| Register commands | `this.addCommand({ id, name, callback })` — auto-cleaned on unload |
| Register settings tab | `this.addSettingTab(new MyTab(this.app, this))` — auto-cleaned on unload |
| Flush async work in onunload | Always wrap in try/catch — unhandled rejections during unload produce silent failures |

## Gotchas

- `onload` is async but Obsidian does not await it in all contexts — keep it fast; defer heavy I/O with `void` if needed.
- Fields assigned mid-`onload` (after the first `await`) may be unset if an earlier `await` throws — guard every such field with `?.` in `onunload`.
- `this.registerEvent` takes the `EventRef` returned by `vault.on()` / `workspace.on()` — it does NOT take a callback directly.

## Avoid

- Calling `vault.off(cb)` manually — use `registerEvent` and let Obsidian handle cleanup.
- Throwing unguarded out of `onunload` — catch all async errors so Obsidian's unload chain is not interrupted.
- Using `!` (non-null assertion) at the call site in `onunload` for fields that may not be assigned.
