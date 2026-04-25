# Phase 1 — Types & Validation: Research

## Zod API Reference (relevant subset)

### Basic types
```typescript
z.string()           // any string
z.string().uuid()    // UUID v4 format
z.string().min(1)    // non-empty string
z.string().length(3) // exactly 3 chars (for currency codes)
z.string().regex(re) // matches regex
z.number()           // any number
z.number().int()     // integer only
z.number().positive()// > 0
z.number().min(0)    // >= 0
z.number().max(100)  // <= 100
z.enum([...])        // one of a fixed set of strings
z.object({...})      // object with named fields
```

### Optional and defaults
```typescript
z.string().optional()      // field may be absent → type: string | undefined
z.enum([...]).default('x') // provides a default if field is absent
```

### Schema derivation
```typescript
schema.omit({ id: true })  // new schema without the 'id' field
schema.partial()           // all fields optional
schema.pick({ a: true })   // only keep 'a'
```

### Type inference
```typescript
type MyType = z.infer<typeof MySchema>;
// Derives the TypeScript type that the schema accepts
```

### Parsing
```typescript
schema.parse(data)       // throws ZodError if invalid
schema.safeParse(data)   // returns { success, data } or { success: false, error }
```

`safeParse` is preferred in modals — never throw from a UI handler.

---

## ISO 8601 Date Format

- Format: `YYYY-MM-DD` (e.g., `2026-04-25`)
- Regex: `/^\d{4}-\d{2}-\d{2}$/`
- This regex accepts invalid calendar dates like `2026-13-99` — if strict date validity is needed, use `new Date(str)` and check `isNaN`. For MVP, the regex is sufficient; invalid calendar dates will be caught during manual use.

---

## ISO 4217 Currency Codes

Common codes used in this project:
| Code | Currency |
|---|---|
| `XOF` | West African CFA franc (Togo, Senegal, etc.) |
| `USD` | US Dollar |
| `EUR` | Euro |
| `GHS` | Ghanaian Cedi |
| `NGN` | Nigerian Naira |

All are 3 uppercase letters. `z.string().length(3)` is the right validator. Case normalization should happen at input time, not in the schema.

---

## XOF: Zero Decimal Places

XOF is one of the currencies with no minor unit (like JPY). The ISO 4217 standard assigns it `exponent: 0`.

- `15000 XOF` means exactly 15,000 francs — there are no centimes.
- Storing as cents: `15000 * 100 = 1500000` — this is deliberately over-precise to keep the storage model uniform. Division by 100 on display always produces an integer, which is correct.
- `Intl.NumberFormat` with `currency: 'XOF'` automatically uses 0 decimal places.

---

## TypeScript Strict Mode

`tsconfig.json` should include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

`noUncheckedIndexedAccess` is not part of `strict` but is worth adding — it makes array/object index access return `T | undefined`, catching off-by-one errors at compile time.

---

## String Unions vs TypeScript Enum

```typescript
// Union (preferred)
type Status = 'open' | 'partial' | 'paid';

// Enum (avoid)
enum Status { Open = 'open', Partial = 'partial', Paid = 'paid' }
```

String unions:
- Serialize to their literal value in JSON: `"open"`
- Work natively with `z.enum([...])`
- No extra import / runtime object
- Are assignable from string literals without casting

TypeScript enums:
- Require `Status.Open` at usage sites — verbose
- Require a matching Zod enum: `z.nativeEnum(Status)`
- Emit runtime JavaScript that can cause issues in ESM builds

---

## Circular Import Risk

The import graph must be acyclic:

```
types.ts     ← no imports from project
schemas.ts   ← imports from types.ts only
everything else ← imports from types.ts and/or schemas.ts
```

If `types.ts` ever imports from `schemas.ts`, esbuild will emit a circular dependency warning and TypeScript may resolve types incorrectly at the boundary.

Rule: `types.ts` has zero project imports. `schemas.ts` imports from `types.ts` only.
