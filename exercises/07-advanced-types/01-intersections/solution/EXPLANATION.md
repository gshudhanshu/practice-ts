# 07/01 — Intersection types

## Union vs intersection — the bit that trips people

```ts
type A = { a: string };
type B = { b: number };

type Both   = A & B;   // { a: string; b: number }  — must have BOTH
type Either = A | B;   // A or B                    — guaranteed members: none
```

| | properties | valid values |
|---|---|---|
| `A & B` | **more** | **fewer** |
| `A \| B` | fewer (only the shared ones are safely readable) | more |

`&` is "and" for *requirements*, which makes it "and" for properties but
effectively an intersection of the value sets. The word matches the values, not
the members — which is why it reads backwards at first.

This also inverts `keyof`:

```ts
type K1 = keyof (A & B);   // "a" | "b"   — every key
type K2 = keyof (A | B);   // never       — no key is on BOTH members
```

## Conflicting intersections become `never`

```ts
type Conflict = { value: string } & { value: number };
type V = Conflict["value"];   // never — nothing is both
```

The type is not an error; it is simply **uninhabited**. You will only find out
at the point where you try to construct one, and the error can be baffling if
you do not know to look for it.

This is exactly why `ApiUser & { id: string }` does not work for TODO 4: it
would give `id: number & string`, i.e. `never`.

> The equivalent conflict with `interface X extends Y` is an error *at the
> declaration* instead — one of the practical reasons to prefer `extends` when
> both are available (06/04).

## The override pattern

```ts
type ClientUser = Omit<ApiUser, "id"> & { id: string };
```

Remove, then re-add. This is the single most useful thing intersections do in
day-to-day code, and it shows up constantly at boundaries:

- an API returns `id: number`, the client wants `id: string`
- a DB row has `created_at: Date`, the DTO wants `createdAt: string`
- a library type is *nearly* right and you need one field widened

The value is that `name` and `email` are **never restated**. Add a field to
`ApiUser` and `ClientUser` gains it automatically. Retyping the whole object by
hand gives you two definitions that will drift.

For several fields at once, the same shape scales:

```ts
type Patched = Omit<Original, "a" | "b"> & { a: string; b: number };
```

Caveat worth knowing: `Omit` does **not** check that the key exists, so
`Omit<ApiUser, "typo">` silently compiles and does nothing. That is a real
footgun, and bonus section 20 builds a stricter version.

## Intersections in `implements`

```ts
export class InMemoryStore implements Store { … }
```

`implements` accepts any object type, so an intersection works exactly like an
interface. The class must supply every member from all three parts.

Composing small capability types (`Readable`, `Writable`, `Clearable`) rather
than declaring one fat `Store` interface means a function can ask for precisely
what it needs:

```ts
function drain(source: Readable & Clearable) { … }   // never writes
```

That is the interface-segregation idea, and it makes test fakes trivial — you
only implement the two methods the function actually uses.

## The empty-string check

```ts
if (value === undefined) return false;
```

`read()` returns `string | undefined`, and `""` is a legitimate stored value.
`if (!value)` would treat a stored empty string as missing — the same
falsy-versus-nullish distinction as `??` vs `||` in 02/04, in a third costume.

## Common mistakes

| Mistake | What happens |
|---|---|
| `ApiUser & { id: string }` | `id` becomes `never`; nothing can satisfy it |
| Retyping `name`/`email` in `ClientUser` | Passes today, drifts the moment `ApiUser` changes |
| `if (!value)` in `copyKey` | A stored `""` is reported as missing |
| `Store` as a single fat type declaration | Works, but loses the ability to ask for one capability |
| `String(apiUser.id)` forgotten | `id` stays a number; the type assertion fails |

## Interview angle

> *"The API gives you `id: number` but your app needs `id: string`. How do you
> type the converted object?"*

`Omit<ApiUser, "id"> & { id: string }`, and say why the naive intersection fails
— `number & string` is `never`. Then the real point: the other fields are never
restated, so the two types cannot drift.

> *"What's the difference between `A | B` and `A & B`?"*

Choice versus combination, and then the inversion that shows you have actually
thought about it: the intersection has more *members* but fewer *values*, and
`keyof` behaves the opposite way round — `keyof (A & B)` is every key, while
`keyof (A | B)` is only the shared ones.
