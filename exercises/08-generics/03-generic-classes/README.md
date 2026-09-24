# 08/03 — Generic classes & interfaces

**Tier:** Core · **Time:** ~30 min · **Course section:** 08 — Generics

---

## Why this exercise exists

A generic class parameterises its whole instance: `Stack<string>` and
`Stack<User>` are different types produced by one definition. Combined with the
generic **interface** in TODO 2, you get the shape almost every real data layer
uses — a typed contract, several implementations, and consumers that depend only
on the contract.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Stack<T>` — `push`, `pop`, `peek`, `size`, `isEmpty`. |
| 2 | `Repository<T>` interface, with `T` constrained so `findById` can work. |
| 3 | `InMemoryRepository<T> implements Repository<T>` — insertion order, replace-by-id. |
| 4 | `Cache<K, V>` — two parameters, plus `getOrCompute`. |
| 5 | `firstMatching` — generic over the **interface**, so any implementation works. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `getOrCompute` must call the factory **at most once per key**, including when
  the cached value is falsy (`0`, `""`).

## Done when

```bash
npm run check 08/03
```

<details>
<summary>Hint 1 — where the type parameter goes</summary>

```ts
export class Stack<T> {
  #items: T[] = [];
  push(item: T): void { … }
  pop(): T | undefined { … }
}
```

Declared once on the class, usable in every member.
</details>

<details>
<summary>Hint 2 — passing the parameter to the interface</summary>

```ts
export class InMemoryRepository<T extends Identifiable> implements Repository<T>
```

The class needs its **own** `T`, and hands it to the interface. `implements
Repository` with no argument is an error, and the constraint has to be repeated
— it is not inherited from the interface.
</details>

<details>
<summary>Hint 3 — the <code>getOrCompute</code> trap</summary>

`if (this.get(key) !== undefined)` fails for a cached `0` or `""` — the factory
would run again every time. Ask the Map whether the **key** exists
(`.has(key)`), not whether the value is truthy.

Same falsy-versus-missing distinction as `once` in 05/03.
</details>

<details>
<summary>Hint 4 — why `K` is unconstrained in TODO 4</summary>

A `Map` can key on anything, including objects — one test caches against an
object key and checks that a structurally-equal but different object misses.
Constraining `K` to `string` would break that for no benefit.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
where to declare a type parameter (class vs method), why `.has()` cannot narrow
`.get()`, and how generic interfaces make test fakes trivial.
