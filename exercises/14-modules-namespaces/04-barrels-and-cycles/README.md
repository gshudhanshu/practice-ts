# 14/04 — Barrels & cycles

**Tier:** Challenge · **Time:** ~35 min · **Course section:** 14 — Modules & namespaces

---

## Where this fits

A circular import is not a compile error. The types resolve, the bundler builds,
the tests for the *types* pass — and then a value is `undefined` at runtime with
a type that swears it cannot be.

14/01 built a barrel and its EXPLANATION listed cycles as the price. This is
that price, made concrete.

## The setup

Four modules sit beside this one, and none of them may be edited:

```
load-order.ts     a recorder with no imports — it can never be in a cycle
pricing.ts        the leaf: TIERS, Tier, priceOf
catalogue.ts      reaches for TIERS through the BARREL — the bug
index-barrel.ts   `export *` from both of the above — the cycle
```

Importing `index-barrel` evaluates `catalogue` first, and `catalogue` imports
`index-barrel` back before `pricing` has been reached. So this line in
`catalogue.ts`:

```ts
export const DEFAULT_TIER = TIERS?.[0];
```

runs against a half-built module. **Read `catalogue.ts` before you start.**

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `brokenDefaultTier` — the barrel's `DEFAULT_TIER`, re-exported. Runtime: `undefined`. |
| 2 | `workingDefaultTier` — the same read, through a direct import of `./pricing`. `"free"`. |
| 3 | `lazyDefaultTier()` — the barrel binding again, read at **call** time. `"free"`. |
| 4 | `catalogue()` — `{ tier, price }` for every tier, in `TIERS` order. |
| 5 | Re-export `TIERS`, `priceOf`, `Tier` and `loadOrder` from the **leaves**. |

TODOs 2 and 3 are the two real fixes, and the pair is the lesson: a cycle does
not corrupt a binding, it only makes it **late**. Reading at module-init time is
what turns that into a bug.

## Rules

- Do not edit `exercise.test.ts`, `pricing.ts`, `catalogue.ts`,
  `index-barrel.ts` or `load-order.ts`.
- No `any`, no `as`, no `!`.
- TODO 1 must keep the barrel import. Removing it makes the failure vanish,
  which is not the same as understanding it.
- TODO 5 must import from `./pricing` and `./load-order`, never from
  `./index-barrel`.
- Do not import `./catalogue` anywhere in `exercise.ts` — entering the cycle
  from a different module changes which half is half-built.

## Done when

```bash
npm run check 14/04
```

<details>
<summary>Hint 1 — two <code>TIERS</code> in one file</summary>

You need both: the barrel's (broken at init, fine later) and the leaf's (fine
always). Rename one on import:

```ts
import { DEFAULT_TIER, TIERS as BARREL_TIERS } from "./index-barrel";
import { TIERS, priceOf, type Tier } from "./pricing";
```

The second statement carries values and a type together with the inline `type`
modifier (14/02).
</details>

<details>
<summary>Hint 2 — why fix 1 works</summary>

`pricing.ts` imports nothing but the recorder, so nothing can point back at it.
Import it directly and there is no cycle to be caught halfway through — the
module is fully evaluated before your line runs.

That is the general rule: **depend on the module that owns the thing, not on a
barrel that happens to forward it.**
</details>

<details>
<summary>Hint 3 — why fix 2 works</summary>

`import` bindings are *live*. `BARREL_TIERS` is not a copy taken at import time;
it is a view onto `pricing`'s `TIERS`, and it updates when that module finally
evaluates.

So the same binding that gave `undefined` at module-init time gives `"free"`
from inside a function body, because by then everything has run. Deferring the
read — a function, a getter, a lazy initialiser — is the fix when you cannot
change the import graph.
</details>

<details>
<summary>Hint 4 — TODO 4 in one line</summary>

`TIERS` is a `readonly` tuple, and `.map` over it gives you an ordinary array
back:

```ts
return TIERS.map((tier) => ({ tier, price: priceOf(tier) }));
```

A fresh array every call comes free — `.map` allocates.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what the same cycle does under native ESM versus CommonJS versus a dev-server
transform, and how to keep barrels without buying cycles — then the
[section summary](../README.md).
