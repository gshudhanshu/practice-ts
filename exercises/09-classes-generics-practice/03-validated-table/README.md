# 09/03 — CHALLENGE: a validated table

**Tier:** Challenge · **Time:** ~35 min · **Course section:** 09 — Classes & generics practice

---

## Where this fits

Part 3 of the section-09 project: a generic store (09/01) whose writes go
through composable validation (09/02). The validation types are given at the top
of the file, so this stands alone if you skipped ahead.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Constructor taking the rules, plus `size`, `findById`, `all()`. |
| 2 | `insert` — duplicate-id check **first**, then all field errors, or store it. |
| 3 | `update` — merge the patch, validate the **result**, roll back on failure. |
| 4 | `remove` — returns whether anything went. |
| 5 | `where(predicate)` and `count(predicate)`. |

### Error contract

| Situation | Result |
|---|---|
| Duplicate id on insert | `[{ field: "id", message: "already exists" }]` |
| Unknown id on update | `[{ field: "id", message: "not found" }]` |
| Field failures | every failing rule, in rule order |
| Success | `{ ok: true, id }` |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- A failed write must change **nothing** — the tests check the stored row after
  a rejected update.
- `update` must keep the row in its original position.

## Done when

```bash
npm run check 09/03
```

<details>
<summary>Hint 1 — validate a candidate, then commit</summary>

Do not write the row and undo it on failure. Build the merged object as a local,
validate *that*, and only store it if the errors list is empty:

```ts
const candidate: T = { ...existing, ...patch };
const errors = this.#validate(candidate);
if (errors.length > 0) return { ok: false, errors };
this.#rows.set(id, candidate);
```

Rollback then costs nothing, because nothing was ever written.
</details>

<details>
<summary>Hint 2 — why validate the merged row, not the patch?</summary>

A patch can be invalid only *in context*. `{ age: 999 }` is meaningless on its
own; it is the resulting row that breaks the rule. Validating the merge is also
what makes cross-field rules possible later.
</details>

<details>
<summary>Hint 3 — <code>Partial&lt;Omit&lt;T, "id"&gt;&gt;</code></summary>

`Omit` drops the id so it cannot be patched; `Partial` makes everything else
optional. Two utility types composed — the tests check that
`update("1", { id: "9" })` is a compile error.
</details>

<details>
<summary>Hint 4 — order matters in <code>insert</code></summary>

The duplicate-id check comes **before** the rules. One test inserts a row that
is both a duplicate *and* invalid, and expects only the id error — identity
problems and content problems are different categories.
</details>

<details>
<summary>Hint 5 — insertion order through an update</summary>

`Map.set` on a key that already exists replaces the value and **keeps its
original position**, so re-setting is all you need (same detail as 06/06).
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

**That completes section 09.** Next: [section 10 — deriving types](../../10-deriving-types/).
