# 04/03 — Reporting

## Rounding to one decimal place

```ts
Math.round((part / whole) * 1000) / 10;
```

Two conversions in one expression: `* 100` turns a ratio into a percentage,
another `* 10` shifts the digit you want to keep above the decimal point, and
`/ 10` puts it back. Check it: `4500/11000 = 0.40909…` → `409.09` → `409` →
`40.9`.

`.toFixed(1)` would produce the string `"40.9"`, not the number `40.9`. The type
says `number`, so rounding arithmetic is the right tool. (In `formatReport` we
interpolate that number, and `${40.9}` renders as `"40.9"` and `${100}` as
`"100"` — which is why the single-item test expects `100%`, not `100.0%`.)

### The zero guard is not paranoia

```ts
if (whole === 0) return 0;
```

`0 / 0` is `NaN`; `5 / 0` is `Infinity`. Both propagate silently through
arithmetic and render as `"NaN%"` in the report. An empty ledger hits this on
the very first call.

## Chaining comparators with `||`

```ts
rows.sort(
  (a, b) => b.totalCents - a.totalCents || compareStrings(a.category, b.category),
);
```

A comparator returns negative / zero / positive. Zero means "equal — defer to
the next rule", and zero is the only falsy value in that set, so `||` chains
tie-breakers exactly. Reading it aloud: "by total descending; if equal, by
category ascending."

Note the subtraction order: `b - a` is descending, `a - b` ascending. Getting
that backwards is the single most common sort bug.

> `a.total - b.total` is fine for integers. For floats, or for values that might
> exceed `Number.MAX_SAFE_INTEGER`, prefer explicit comparisons — subtraction
> can lose precision or overflow.

## Why `compareStrings` instead of `localeCompare`

`localeCompare` is locale-sensitive by default. It can order differently on
different machines, treats case and accents according to locale rules, and is
markedly slower. For **sort keys** — identifiers, enum members, ISO dates — you
want a stable, deterministic, byte-order comparison:

```ts
if (a < b) return -1;
if (a > b) return 1;
return 0;
```

Use `localeCompare` when you are sorting text **for a human to read**, and pass
an explicit locale when you do.

## `Map` vs plain object for grouping

`Map` was used here for three reasons:

1. **`.get` returns `V | undefined` honestly** — matching the reality that a key
   may be missing, without depending on `noUncheckedIndexedAccess`.
2. **No prototype keys.** A plain object has `"constructor"`, `"toString"` and
   friends inherited; a category literally named `"constructor"` would behave
   strangely. (`Object.create(null)` avoids this, but is less readable.)
3. **Insertion order is guaranteed for all key types.** Plain objects order
   integer-like keys numerically first, which surprises people grouping by
   numeric ids.

A plain `Record<Category, …>` is perfectly fine here too — the keys are a closed
union of safe names. `Map` is the safer default when keys are arbitrary strings.

> Modern alternative worth knowing: `Object.groupBy` / `Map.groupBy` (ES2024)
> do the accumulation step in one call. Deliberately not used here so that the
> accumulate-then-transform-then-sort shape stays visible.

## The three-phase shape

Every one of these functions is the same pipeline:

1. **Accumulate** into a keyed structure (`Map`).
2. **Transform** into the output row shape (`.map`).
3. **Sort** last, on the finished rows.

Doing them in that order keeps each step trivial. Trying to sort while
accumulating, or to compute percentages before the grand total exists, is where
this exercise gets hard.

## Common mistakes

| Mistake | What happens |
|---|---|
| Iterating `CATEGORIES` to build rows | Five rows always; the "omits empty categories" test fails |
| Forgetting the `whole === 0` guard | `"NaN%"` in the report for an empty ledger |
| `a.totalCents - b.totalCents` | Ascending order; the sort test fails |
| Omitting the tie-break | `housing`/`transport` order becomes input-dependent |
| `.toFixed(1)` for `percentage` | Returns a string; the type and the `40.9` assertion both fail |
| `${row.percentage.toFixed(1)}%` in the report | `"100.0%"` instead of `"100%"` |
| Recomputing the grand total per row | Correct, but O(n²) — hoist it |

## Interview angle

> *"Sort these results by score descending, then by name."*

Show the `||` chain and say why it works (zero is the only falsy comparator
result). Then mention that `Array.prototype.sort` has been **stable** since
ES2019, so an explicit tie-break is about being deterministic and
self-documenting rather than about the engine.

> *"How would you group a list by a key?"*

`Map` + accumulate, or `Object.groupBy` in a modern runtime. The detail that
marks experience: mention that `.get` returning `undefined` for a new key is the
case you must handle, and that plain objects carry prototype keys — which is a
real footgun when the keys come from user data.
