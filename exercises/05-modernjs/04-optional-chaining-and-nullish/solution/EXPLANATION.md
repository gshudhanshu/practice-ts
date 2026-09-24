# 05/04 — Optional chaining & the nullish operators

## The three forms of `?.`

```ts
obj?.prop     // optional property access
obj?.[key]    // optional index      — the dot is required
fn?.()        // optional call       — the dot is required
```

The `.` before `[` and `(` is not optional syntax sugar; without it you have
written plain indexing or a plain call.

### Short-circuiting is the whole chain, not one link

```ts
response.data?.items?.[0]?.label
```

If `data` is nullish, the **entire expression** evaluates to `undefined` — the
rest is never touched. That includes arguments: in `a?.b(expensive())`,
`expensive()` is not called when `a` is nullish.

The result of a short-circuited chain is always `undefined`, never `null`, even
if the nullish value in the middle was `null`.

## `??` vs `||` — decide from the requirement

| Operator | Falls back on |
|---|---|
| `??` | `null`, `undefined` |
| `\|\|` | `null`, `undefined`, `0`, `""`, `NaN`, `false`, `-0`, `0n` |

**TODO 2 wants `??`.** A total of `0` is real data — replacing it with a default
would report "0 results" as "no data".

**TODO 5 wants `||`.** The requirement explicitly says an empty nickname counts
as no nickname. Using `??` here would return `""` and render a blank name.

The general rule: `??` is the safer default, because "0 and empty string are
real values" is true far more often than not. But the point of having both
cases here is that the answer comes from the domain, not from a habit. Say out
loud "is empty string a valid value here?" and the operator picks itself.

## Logical assignment operators

```ts
a ??= b;   // a = a ?? b   — assign only if a is nullish
a ||= b;   // a = a || b   — assign only if a is falsy
a &&= b;   // a = a && b   — assign only if a is truthy
```

All three **short-circuit the assignment itself**, not just the value. If `a` is
already present, no write happens at all. That matters for setters, Proxies, and
frameworks that track property writes for reactivity (Vue, MobX, signals) —
`a = a ?? b` would trigger a spurious update where `a ??= b` does not.

In `bumpVisit`, `visits.count ??= 0` leaves an existing `0` alone, which is
exactly what the test checks.

## `??` cannot be mixed with `||` or `&&`

```ts
a ?? b || c     // SyntaxError
(a ?? b) || c   // fine
a ?? (b || c)   // fine
```

This is deliberate. The two operators have genuinely different semantics and
there is no intuitive precedence between them, so the language forces you to
parenthesise rather than guess. One of the rare places JavaScript chose
explicitness.

## What TypeScript does with these

Narrowing flows through all of them:

```ts
const label = response.data?.items?.[0]?.label;   // string | undefined
const safe = label ?? "none";                     // string — `??` removes undefined
```

TypeScript will also tell you when a `?.` is **pointless** — if the left side
cannot be nullish, you get "the expression is always defined". Take those
seriously: a redundant `?.` usually means either the type is wrong or you have
misread it. Defensive `?.` sprinkled everywhere is a smell; it silences the
compiler exactly where you wanted it to speak.

## Common mistakes

| Mistake | What happens |
|---|---|
| `?.` missing before `[0]` or `()` | Plain index/call — throws on nullish |
| `\|\| 0` in TODO 2 | Right answer by luck; wrong the moment the default is non-zero |
| `??` in TODO 5 | `""` is returned; the cleared-nickname test fails |
| `if (!visits.count) visits.count = 0` | Same result here, but not the operator asked for |
| `a ?? b \|\| c` | Syntax error |
| `data?.items[0]` | Only the first link is guarded — the index still throws |

## Interview angle

> *"When would you use `||` instead of `??`?"*

Great question to answer with a concrete case rather than a definition: a form
field where the empty string means "cleared", exactly like TODO 5. Then state
the default position — `??` unless empty/zero should be treated as missing —
which shows you have a rule rather than a habit.

> *"Does `?.` protect against everything?"*

No. It guards `null` and `undefined` only. `obj?.method()` still throws if
`obj` exists but `method` does not — for that you need `obj.method?.()`. Being
precise about *which* link each `?.` protects is the distinction worth drawing.
