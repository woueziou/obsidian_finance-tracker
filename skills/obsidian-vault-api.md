---
description: Vault read/modify/create patterns including null-checks, error handling, and the isWriting guard for FileWatcher coexistence.
---

## API / Patterns

| Pattern | Correct usage |
|---|---|
| Get a file handle | `const file = vault.getFileByPath(path)` — returns `TFile \| null`; always null-check before use |
| Read a file | `const content = await vault.read(file)` — async, can throw; wrap in try/catch |
| Write a file | `await vault.modify(file, content)` — async, can throw; wrap in try/catch |
| Create a new file | `await vault.create(path, content)` — throws `Error` if the file already exists; check with `getFileByPath` first |
| Create-or-modify pattern | `const f = vault.getFileByPath(p); if (f) { await vault.modify(f, c); } else { await vault.create(p, c); }` |
| Suppress FileWatcher on own writes | Set `isWriting = true` before `vault.modify()`, reset in `finally` — FileWatcher checks this flag before reloading |

## Gotchas

- `vault.getAbstractFileByPath()` returns `TAbstractFile` (could be `TFolder`) — prefer `getFileByPath()` which guarantees `TFile`.
- `vault.create()` is not idempotent — calling it twice on the same path throws; always guard with `getFileByPath`.
- Both `read` and `modify` are async and can throw on disk errors, permission issues, or if the vault is closing — never leave them unwrapped.

## Avoid

- `require('fs')` or any Node.js `fs` calls — Obsidian may run in contexts where direct fs access is not safe; always go through the vault API.
- Calling `vault.modify()` on every keystroke — debounce to 1–2 seconds minimum.
- Ignoring the return value of `vault.on()` — always pass the `EventRef` to `this.registerEvent()`.
