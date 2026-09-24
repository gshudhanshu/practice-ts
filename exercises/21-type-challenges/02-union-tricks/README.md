# 21/02 — Union tricks

**Tier:** Core → Challenge · **Time:** ~35 min · **Section:** 21 — Type challenges

---

## Why this exercise exists

These are the types that turn up in every serious codebase's `types.ts` and that
nobody can explain on the spot:

```ts
type IsAny<T> = 0 extends 1 & T ? true : false;
type UnionToIntersection<T> =
  (T extends unknown ? (arg: T) => void : never) extends (arg: infer I) => void ? I : never;
```

Each one exploits a rule that exists for a completely different reason — `any`'s
two-way assignability, parameter contravariance, distribution over a copy of the
same union. Once you can name the rule, the type stops being folklore.

Distribution was taught in [10/04](../../10-deriving-types/04-conditional-types/)
and `IsNever` in
[20/03](../../20-utility-types-from-scratch/03-union-filters/); this exercise
uses both without re-deriving them.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `IsAny<any>` → `true`, `IsUnknown<unknown>` → `true`, and nothing else is either. |
| 2 | `UnionToIntersection<{a: string} \| {b: number}>` → `{a: string} & {b: number}`. |
| 3 | `IsUnion<string \| number>` → `true`; `IsUnion<string>` → `false`. |
| 4 | `UnionToTuple<"a" \| "b" \| "c">` → `["a", "b", "c"]`. |
| 5 | `mergeConfigs(base, override)` — the runtime twin of TODO 2. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!` **in your solution**. (The test file uses `any` on
  purpose — it has to, to check `IsAny`.)

## Done when

```bash
npm run check 21/02
```

<details>
<summary>Hint 1 — the <code>IsAny</code> lever</summary>

`1 & T` is `1` for every ordinary `T`, so `0 extends 1 & T` is false. The one
exception: `1 & any` is `any`, and everything extends `any`.

`unknown` does not do this (`1 & unknown` is `1`), which is what makes the
detector precise.
</details>

<details>
<summary>Hint 2 — why <code>IsUnknown</code> needs <code>IsAny</code></summary>

`unknown extends T` is the obvious test, and it is true for `unknown` — but also
for `any`, which is assignable in **both** directions to everything.

So rule `any` out first:

```ts
type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;
```

This ordering problem — "handle the pathological type before the normal
question" — is the same shape as guarding `never` before distributing in TODO 3.
</details>

<details>
<summary>Hint 3 — contravariance, concretely</summary>

```ts
type Fns = ((arg: { a: string }) => void) | ((arg: { b: number }) => void);
```

What single function is assignable to that union? One that copes with **either**
argument — so it must accept `{a: string} & {b: number}`. Parameters are
contravariant: a function that takes *more* types is assignable where one that
takes fewer is expected.

`infer` in parameter position collects exactly that, which is why the union
comes back out as an intersection.
</details>

<details>
<summary>Hint 4 — <code>IsUnion</code> needs two type parameters</summary>

```ts
type IsUnion<T, U = T> = …
```

`T` is naked on the left of `extends`, so it distributes; `U` sits in the branch
untouched, so it is still the whole union. That lets you ask "is the whole thing
the same as this single member?" — which is only true when there was one member.

Handle `never` before you distribute.
</details>

<details>
<summary>Hint 5 — extracting the last union member</summary>

`UnionToIntersection<T extends unknown ? () => T : never>` gives you an
**overloaded** function type (returns are covariant, so they do not merge the
way parameters do). `infer` on an overload resolves to the **last** signature,
which hands you one member.

Then `Exclude<T, Last>` is the rest, and recursion walks it:

```ts
type UnionToTuple<T> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<T, LastOf<T>>>, LastOf<T>];
```

Union order is not part of the language specification — the explanation is
honest about what that means.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the contravariance rule in full, why union order is an implementation detail you
should not build on, and when `UnionToIntersection` is genuinely the right tool.
