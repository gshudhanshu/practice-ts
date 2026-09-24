# 16/03 — typing callback APIs

**Tier:** Core · **Time:** ~30 min · **Course section:** 16 — Third-party libraries

---

## Why this exercise exists

Half the JavaScript you will ever depend on hands you an error-first callback:

```ts
(error: Error | null, value?: T) => void
```

That type is honest and still bad. It permits **four** combinations — error and
value, error and nothing, nothing and value, nothing and nothing — while the API
only ever produces two of them. `error` and `value` are correlated, and the type
cannot say so, so every caller writes the same defensive dance and half of them
get it wrong.

You cannot fix this with a cleverer callback type. You fix it with a
**boundary**: wrap the API once, and hand everything above that line a
`Promise<T>` — a type where "either/or" is finally expressible. Same move as
`safeJsonParse` in 02/06, one layer up.

`legacy-store.ts` is the callback API. **Read it first**: one of its calls back
with neither an error nor a value, which is the case the type quietly allowed.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `NodeCallback<T>` — the error-first shape, generic |
| 2 | `promisify1` — the generic bridge, with the third case handled |
| 3 | `loadRecordAsync` — the facade, built from `promisify1` |
| 4 | `readRecord` — the dual callback/promise API, with overloads |
| 5 | `settle` — the discriminated-union alternative to rejecting |

### TODO 2 — the three outcomes

| Callback receives | The promise |
|---|---|
| an `Error` | rejects with it |
| a value | resolves with it |
| neither | rejects with `TypeError("the callback produced neither an error nor a value")` |

### TODO 4 — the dual API

```ts
readRecord("r1")            // Promise<StoredRecord>
readRecord("r1", callback)  // void
```

One return type cannot depend on whether an optional argument was passed, so
this needs overload signatures (07/03).

## Rules

- Do not edit `exercise.test.ts` or `legacy-store.ts`.
- No `any`, no `as`, no `!`.
- `promisify1` must infer both type parameters from its argument — the test
  calls it with no explicit type arguments.
- `loadRecordAsync` must be built from `promisify1`, not a second hand-written
  `new Promise`.

## Done when

```bash
npm run check 16/03
```

<details>
<summary>Hint 1 — the shape of the bridge</summary>

```ts
return (arg) =>
  new Promise<Value>((resolve, reject) => {
    operation(arg, (error, value) => { … });
  });
```

`promisify1` returns a *function*, and that function returns the promise. The
`new Promise` executor is the only place the callback style survives.
</details>

<details>
<summary>Hint 2 — check the error first, then the value</summary>

`if (error !== null) { reject(error); return; }` — then `value` is still
`Value | undefined`, because the type never linked them. Handle `undefined`
explicitly rather than resolving with it; that single decision is what makes
`Promise<Value>` a promise you can trust.
</details>

<details>
<summary>Hint 3 — writing overloads</summary>

```ts
export function readRecord(id: string): Promise<StoredRecord>;
export function readRecord(id: string, done: NodeCallback<StoredRecord>): void;
export function readRecord(
  id: string,
  done?: NodeCallback<StoredRecord>,
): Promise<StoredRecord> | void {
  …
}
```

The implementation signature is not visible to callers; it only has to be
compatible with both. Resolution is first-match-wins, so the specific signature
goes first.
</details>

<details>
<summary>Hint 4 — <code>settle</code> is four lines</summary>

`try { return { ok: true, value: await promise } } catch (error) { … }`.
`catch` gives you `unknown` (`useUnknownInCatchVariables`), so narrow with
`error instanceof Error ? error.message : String(error)` — the same shape as
07/05.
</details>

<details>
<summary>Hint 5 — why the union must be discriminated</summary>

`{ ok: boolean; value?: T; error?: string }` compiles and helps nobody:
`result.value` is `T | undefined` in both branches. The union of two closed
object types lets `if (result.ok)` narrow to exactly one of them, which is why
the test asserts on the narrowed types.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `util.promisify` needs a special type, what `__promisify__` is, when a dual
API is worth the overloads, and rejecting versus returning a `Result`.

Next: [16/04 — the typed facade](../04-typed-facade/).
