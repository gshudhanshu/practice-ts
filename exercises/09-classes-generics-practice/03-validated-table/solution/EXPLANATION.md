# 09/03 — A validated table

## Validate a candidate, then commit

```ts
const candidate: T = { ...existing, ...patch };
const errors = this.#validate(candidate);
if (errors.length > 0) return { ok: false, errors };
this.#rows.set(id, candidate);
```

The row is never written until it is known good, so there is **no rollback to
implement** — the failure path simply returns.

The alternative (write, validate, undo on failure) needs a saved copy, correct
restoration, and care about anything observing the intermediate state. Databases
call this an abort-before-commit, and it is strictly simpler than compensating
afterwards.

The test that pins it re-reads the row after a rejected update and expects it
byte-identical.

## Validate the merged row, not the patch

`{ age: 999 }` is not invalid on its own — it is the *resulting row* that breaks
the rule. Validating the merge is also what makes cross-field rules work:

```ts
{ field: "range", check: (row) => (row.min > row.max ? "min exceeds max" : null) }
```

A patch-only validator could never express that, because it cannot see the
fields the patch does not touch.

## Identity errors before content errors

```ts
if (this.#rows.has(item.id)) {
  return { ok: false, errors: [{ field: "id", message: "already exists" }] };
}
```

One test inserts a row that is *both* a duplicate and invalid, and expects only
the id error. The reasoning: a duplicate id means this write cannot happen at
all, so listing field problems alongside it is noise — the caller must change
the id before any of it matters.

Same principle as validating outside-in in 07/05: check the container before its
contents.

## `Partial<Omit<T, "id">>`

Two utility types composed, and each earns its place:

- `Omit<T, "id">` — the id is the identity, not data. Patching it would mean
  "delete this row and create another".
- `Partial<…>` — a patch supplies only what changes.

The result is that `update("1", { id: "9" })` is a compile error, which is a
much better outcome than a runtime check.

> Under `exactOptionalPropertyTypes`, `Partial<T>` produces *exact* optional
> properties, so `{ age: undefined }` will not satisfy it. That is correct here:
> "do not change age" is expressed by omitting the key (03/03).

## Spreading a `Partial` over the whole object

```ts
const candidate: T = { ...existing, ...patch };
```

TypeScript understands that spreading `Partial<Omit<T, "id">>` over a `T`
yields a `T` — every property is either overwritten by a compatible value or
kept. That is why no cast is needed.

Note it works only because `patch` cannot carry `undefined` values. If it could
(a `{ [K in keyof T]?: T[K] | undefined }` patch type), this spread would
reintroduce the config-merge bug from 03/03 and you would have to assign field
by field.

## `Map` again, for the same three reasons

O(1) lookup by id, guaranteed insertion order for `all()`, and `set` on an
existing key keeping its position — so an update does not move a row to the end.
That last one is checked by a test, and it is the detail people miss.

`remove` returns `Map.delete`'s boolean directly, because the API already
answers the question being asked.

## Copying the rules

```ts
this.#rules = [...rules];
```

Otherwise a caller mutating their rules array afterwards would silently change
the table's validation behaviour. Same defensive copy as `Collection.from` in
09/01 — the general principle being **do not store a reference you do not
control**.

## The `WriteResult` union

```ts
type WriteResult =
  | { ok: true; id: string }
  | { ok: false; errors: readonly ValidationError[] };
```

A discriminated union rather than a thrown exception, because a validation
failure is an **expected outcome**, not a bug (06/01). The compiler then forces
callers to check `ok` before reading either field, so there is no way to read
`errors` off a success.

This is the shape a `Result<T, E>` type generalises — built properly in the
bonus sections.

## Common mistakes

| Mistake | What happens |
|---|---|
| Storing then validating | The rolled-back-row test fails |
| Validating the patch instead of the merge | Context-dependent rules cannot fire |
| Rules checked before the duplicate id | The combined duplicate+invalid test fails |
| `delete` + `set` on update | The row moves to the end; the order test fails |
| `patch: Partial<T>` | `update("1", { id: "9" })` compiles |
| Storing the rules array directly | Caller mutations change validation later |
| `count` re-implementing the filter | Works, but `where(...).length` already exists |

## Interview angle

> *"How do you validate before writing, and roll back if it fails?"*

Do not roll back — build a candidate, validate it, and commit only on success.
Then the follow-up detail: validate the **merged** result rather than the patch,
because validity is a property of the whole row.

> *"Return an error object or throw?"*

Expected outcomes (a failed validation) are returned as a discriminated union so
the compiler forces callers to handle them. Bugs and impossible states throw.
Being able to draw that line — and pointing out that the union makes reading
`errors` off a success impossible — is the substantive answer.
