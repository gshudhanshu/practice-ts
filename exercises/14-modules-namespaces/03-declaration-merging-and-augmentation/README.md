# 14/03 — Declaration merging & augmentation

**Tier:** Core · **Time:** ~25 min · **Course section:** 14 — Modules & namespaces

---

## Where this fits

[06/04](../../06-classes-interfaces/04-interfaces-vs-type-aliases/README.md)
established the rule: an interface declared twice **merges**; a type alias
declared twice is an error. It is not re-explained here.

This exercise is about what that rule is *for* — reaching into declarations you
do not own and adding to them. Five shapes, one mechanic:

```ts
interface X {} + interface X {}    two halves of one type
function f() {} + namespace f {}   properties on a function
class C {}     + namespace C {}    statics from outside the class body
declare module "./m" { … }         reach into another module
declare global { … }               reach into the global scope
```

`http-lite.ts` sits beside this file and stands in for a library you cannot
edit. TODO 3 adds a field to its `Request` interface from `exercise.ts`, and the
test imports `Request` **from the library** to prove the change landed on the
original type rather than a local copy.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | A second `interface Job` adding `retries` and `status`; `describeJob`. |
| 2 | `formatJob` + a namespace giving it `UNKNOWN` and `orUnknown`. |
| 3 | `declare module "./http-lite"` adding `user?: SessionUser`; `attachUser`, `requestOwner`. |
| 4 | `declare global` with `var appBuild`; `setBuild`, `currentBuild`. |
| 5 | `namespace Money` adding `ZERO` and `fromPounds` as statics. |

## Rules

- Do not edit `exercise.test.ts` or `http-lite.ts`.
- No `any`, no `as`, no `!`.
- TODO 1: do not edit the existing `interface Job` — add another declaration.
- TODO 5: no `static` members inside the class body. The merge is the exercise.
- The `Request` augmentation must be visible to `./http-lite`'s own type, not
  just to a local alias.

## Done when

```bash
npm run check 14/03
```

<details>
<summary>Hint 1 — the namespace goes after</summary>

```ts
export function formatJob(job: Job): string { … }

export namespace formatJob {
  export const UNKNOWN = "unknown job";
  export function orUnknown(job: Job | undefined): string { … }
}
```

Only `export`ed members of the namespace become properties. Inside it,
`formatJob` still refers to the merged entity, so `orUnknown` can call the
function.
</details>

<details>
<summary>Hint 2 — the augmentation body sees this file's scope</summary>

```ts
declare module "./http-lite" {
  interface Request {
    user?: SessionUser;
  }
}
```

Two things make it work: the specifier is exactly what you would `import` from,
and the file is a **module** (it has imports and exports). In a script file the
same syntax means "declare a new ambient module" instead, and the augmentation
silently does nothing.

No `export` keyword on the inner `interface` — inside an augmentation of an
existing module, members are added to what is already exported.
</details>

<details>
<summary>Hint 3 — <code>var</code>, not <code>let</code></summary>

```ts
declare global {
  var appBuild: string | undefined;
}
```

Only `var` declarations become properties of `globalThis`. Declare it with
`let` or `const` and `globalThis.appBuild` will not typecheck — which is the
one thing the tests check.
</details>

<details>
<summary>Hint 4 — a static that mentions its own class</summary>

```ts
export namespace Money {
  export function fromPounds(pounds: number): Money { … }
  export const ZERO = new Money(0);
}
```

Inside the namespace, `Money` resolves to the merged declaration, so the class
is usable as both a type and a constructor. The namespace has to come after the
class, because its body runs at that point.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
when augmentation is the right tool and when it is a trap, and why `declare
global` lies to you — then move on to
[14/04](../04-barrels-and-cycles/README.md).
