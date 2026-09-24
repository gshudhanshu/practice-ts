# 02/01 — Primitives & Inference

## Why each answer is what it is

### 1. `const TAX_RATE = 0.08` — drop the annotation

`const x = 0.08` infers the **literal type** `0.08`. Adding `: number` *widens*
it, permanently discarding information TypeScript had for free.

```ts
const a = 0.08;          // type: 0.08   ← narrow, useful
const b: number = 0.08;  // type: number ← widened, less useful
let   c = 0.08;          // type: number ← `let` widens too, by design
```

The rule: **annotate to constrain, never to restate.** If the annotation says
the same thing inference would, delete it. If it says something *wider*, you are
actively losing type safety.

This matters as soon as literal types drive behaviour — discriminated unions,
`as const` config objects, and template literal types all collapse the moment
something widens to `string` or `number`.

### 2. `type Currency = "USD" | "EUR" | "INR"`

A union of string literals. `"GBP"` is now a compile error, autocomplete lists
exactly three options, and there is zero runtime cost.

Interviewers often ask "union of literals or `enum`?" The modern answer:
**prefer the union.** A TS `enum` emits a real JavaScript object, is nominally
typed (surprising), and does not narrow from plain strings. Sections 02 and 06
of the course cover `enum`; production code mostly does not use it.

### 3. `parsePriceToCents(raw: string): number | null`

Two ideas worth internalising:

**Encode failure in the type.** Returning `number | null` means every caller is
*forced* by the compiler to handle the bad-input case. Returning `number` and
throwing (or returning `NaN`, or `-1`) pushes that burden onto human discipline,
which does not scale.

**Round after scaling, never truncate.** `19.99 * 100 === 1998.9999999999998`.
`Math.floor` there silently bills the customer a cent less. This exact bug shows
up in real payment code, which is why the test pins `"19.99"` and `"1.10"`.

Regex `/^\d+(\.\d+)?$/` is the guard, not `Number(raw)` alone — `Number("")` is
`0` and `Number(" 12 ")` is `12`, both of which should be rejected here.

### 4. `formatCents` — `toFixed(2)`

`(cents / 100).toFixed(2)` is the whole job. `toFixed` returns a `string`, so
the declared return type is honest.

> For real products you would reach for `Intl.NumberFormat`, which handles
> locale-specific separators and symbol placement. It is avoided here so the
> assertions stay stable across machines — a genuinely good instinct to mention
> if this comes up in an interview.

### 5. `withTax` — no return annotation

`Math.round(number)` is `number`. Inference already knows. The exercise forces
you to notice that the annotation would add nothing.

**When you *should* annotate a return type anyway:**
- On exported/public API boundaries, so an accidental change breaks *here*
  rather than at every call site.
- On recursive functions, where inference cannot converge.
- When you want the compiler to check the implementation against your intent
  rather than infer your intent from a possibly-buggy implementation.

## Common mistakes

| Mistake | What happens |
|---|---|
| Keeping `: number` on `TAX_RATE` | `Equal<typeof TAX_RATE, 0.08>` fails |
| `type Currency = string` | `"GBP"` compiles; the `@ts-expect-error` line errors as *unused* |
| Returning `NaN` instead of `null` | Return type stays `number`; the type assert fails |
| `Math.floor(n * 100)` | `"19.99"` yields 1998 |
| `parseFloat(raw)` with no regex guard | `"1.2.3"` parses as `1.2`, `""` fails differently |

## Interview angle

> *"When do you annotate, and when do you let TypeScript infer?"*

Infer locals and internal helpers; annotate **boundaries** — exported functions,
public class members, and anything crossing a module or network edge. The reason
is error localisation: an annotated boundary reports the error where the mistake
was made, while pure inference reports it wherever the bad type finally collides
with something, often files away.

Follow-up you should be ready for: *"why is `as const` useful then?"* — because
object and array literals widen their members by default, and `as const` is how
you opt back into the narrow literal types you just saw `const` give you for
free on a primitive.
