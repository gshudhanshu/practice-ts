# 16/04 — CHALLENGE: a typed facade over an untyped dependency

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 16 — Third-party libraries

---

## Why this exercise exists

`any` is not a type. It is a request that the compiler stop working, and it is
**contagious**: every value derived from an `any` is an `any`, silently, until it
surfaces three modules away as `undefined is not a function`.

You cannot delete the `any` here — it belongs to a dependency you do not own.
What you can decide is **where it stops**:

1. one function calls the vendor and widens `any` to `unknown`;
2. validators turn `unknown` into your own types;
3. everything above sees only your types — and the vendor's casing, its numeric
   `ok: 1`, and its undocumented endpoints never leak into your application.

Same idea as `safeJsonParse` in [02/06](../../02-essentials/06-unknown-and-exhaustiveness/):
`JSON.parse` returns `any`, and the fix is not to trust it more carefully but to
narrow it once, where it enters.

The test proves the containment with `IsAny<…>`: the vendor's functions must
still be `any`, and nothing you export may be.

## Your task

`vendor-flags.ts` is the dependency. **Read it first** — its list endpoint mixes
junk into the array, its write endpoint reports success as the number `1`, and
one key is still served by an endpoint that replies with a bare string.

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `callVendor` — the only function that touches the vendor. Returns `unknown` |
| 2 | `isRawFlag` — the type predicate that gates everything |
| 3 | `getFlag` — one flag, translated into the domain shape |
| 4 | `listFlags` — the valid flags, in order, junk dropped |
| 5 | `setFlag` — the vendor's three write responses, normalised |

### TODO 3 & 4 — the translation

| Vendor | You |
|---|---|
| `{ key, value, updated_at }` | `{ key, value, updatedAt }` |
| `null`, or a record that fails `isRawFlag` | `null` |
| an array with junk in it | only the flags, in order |
| not an array at all | `[]` |

### TODO 5 — the write responses

| Vendor returns | `setFlag` returns |
|---|---|
| `{ ok: 1 }` | `{ ok: true }` |
| `{ ok: 0, error: "unknown flag" }` | `{ ok: false, reason: "unknown flag" }` |
| anything else | `{ ok: false, reason: "unexpected response from the vendor" }` |

## Rules

- Do not edit `exercise.test.ts` or `vendor-flags.ts`.
- **No `any`, no `as`, no `!` in `exercise.ts`.** The `any` in `vendor-flags.ts`
  is the dependency; that is the point. `unknown` is your side of the boundary.
- `callVendor` must be the only function that imports or calls the vendor.
- `getFlag` and `listFlags` need real return types — `unknown` is the
  boundary's job, not the facade's.

## Done when

```bash
npm run check 16/04
```

<details>
<summary>Hint 1 — widening any to unknown takes no cast</summary>

```ts
const raw: unknown = fetchFlag(key);   // `any` -> `unknown`, by assignment
```

`any` is assignable to everything, so this is an ordinary assignment. The
significant half is the other direction: `unknown` is assignable to nothing
without a check, which is what forces every caller to validate.
</details>

<details>
<summary>Hint 2 — narrowing <code>unknown</code> without an index signature</summary>

```ts
if (typeof value !== "object" || value === null) return false;
if (!("key" in value)) return false;
return typeof value.key === "string";
```

The `in` operator narrows an `object` to one that has the property, so the
`typeof` check afterwards compiles with no cast. An array fails the `in` check,
so `Array.isArray` is not needed here.
</details>

<details>
<summary>Hint 3 — <code>filter</code> with a predicate</summary>

`array.filter(isRawFlag)` returns `RawFlag[]`, not `unknown[]`, because
`Array.prototype.filter` has an overload taking a type predicate. That single
call is what removes the junk *and* the uncertainty.
</details>

<details>
<summary>Hint 4 — <code>Array.isArray</code> hands you an <code>any[]</code></summary>

It is declared `arg is any[]`, so narrowing `unknown` with it puts `any` straight
back into your pipeline. Wrap it in a predicate of your own:

```ts
function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
```
</details>

<details>
<summary>Hint 5 — the third write response</summary>

The vendor can return a shape you have never seen — here, a bare string from an
older endpoint. A facade always has an answer for that, and the answer is never
"pass it through". Check the response is an object with an `ok` before you look
at what `ok` is.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
`any` versus `unknown` at a boundary, why the wire shape and the domain shape
should be different types, what a schema library buys you here, and how to keep
a facade honest as the dependency changes.

**That completes section 16.** Next:
[section 17 — third-party libraries in practice](../../17-libs-practice/).
