# 06/04 — Interfaces vs type aliases

**Tier:** Core · **Time:** ~20 min · **Course section:** 06 — Classes & interfaces

---

## Why this exercise exists

"Interface or type alias?" is a genuine daily decision and a standard interview
question. They overlap for object shapes, so the useful knowledge is the cases
where the answer is **forced** — and this exercise contains one in each
direction.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Identified` (`id: string`) and `Timestamped` (`createdAt`, `updatedAt`) as interfaces. |
| 2 | `Entity` extends **both** and adds `name: string`. |
| 3 | `Id = string \| number` — a union, which an interface **cannot** express. |
| 4 | Add a **second** `AppConfig` interface declaration contributing `debug: boolean` — declaration merging, which only interfaces can do. |
| 5 | `Repository` contract + `InMemoryRepository implements Repository`. |

### The `Repository` contract

```ts
add(entity: Entity): void
findById(id: string): Entity | undefined
readonly size: number
```

Adding an entity with an existing id replaces it.

## Rules

- Do not edit `exercise.test.ts`.
- Do not edit the existing `AppConfig` declaration — **add** a second one.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 06/04
```

<details>
<summary>Hint 1 — extending several interfaces</summary>

```ts
interface C extends A, B { extra: string }
```

Comma-separated, any number. The type-alias equivalent is an intersection:
`type C = A & B & { extra: string }`.
</details>

<details>
<summary>Hint 2 — declaration merging</summary>

Write a second `export interface AppConfig { … }` in the same file. TypeScript
merges same-named interfaces in the same scope into a single type rather than
complaining about a duplicate. Two `type` aliases with the same name is a hard
error.

This is how `declare global { interface Window { myThing: X } }` works.
</details>

<details>
<summary>Hint 3 — satisfying <code>readonly size</code></summary>

A getter satisfies a `readonly` property. `Map` already tracks its own `size`,
so the getter is one line — and `Map.set` replaces an existing key, which gives
you the replace-on-duplicate behaviour for free.
</details>

---

## The short answer, for when you are asked

Use `interface` for object shapes that might be **extended or augmented** —
public API surfaces, props, contracts a class implements. Use `type` for
everything else: unions, tuples, primitives, functions, mapped and conditional
types.

Many teams simply pick one and stay consistent, which is also fine. What is not
fine is not knowing that declaration merging and unions each force the answer.

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) for the
full comparison table and the performance/error-message differences.
