# 09/02 — Composable validators

## Factories, not validators

```ts
required()        // returns a Validator<string>
minLength(3)      // returns a Validator<string>
inRange(0, 150)   // returns a Validator<number>
```

Each function *returns* a validator rather than being one. That is what lets
them carry configuration (a message, a length, a range) while every **result**
shares the single `Validator<T>` shape.

Uniform shape is what makes composition possible: `combine` does not care how a
validator was built, only that it matches `(value: T) => string | null`.

This is the same idea as the pricing rules in 06/06 — one interface, many
implementations — expressed with closures instead of classes. Worth noticing
that they are interchangeable designs.

## `string | null` rather than `boolean`

Returning the message means the validator carries *why* it failed. A boolean
would force the caller to reconstruct the reason, and `combine` could not report
which check failed.

`null` for success (rather than `undefined`) is a deliberate convention: it
distinguishes "checked and fine" from "no result", and reads clearly in
`error !== null`.

## First error wins

```ts
for (const validate of validators) {
  const error = validate(value);
  if (error !== null) return error;
}
return null;
```

Reporting *all* errors for one field is usually worse UX: "is required, and must
be at least 5 characters" for an empty input is noise, because the second
message is a consequence of the first. Ordering validators from most to least
fundamental and stopping at the first is what forms are expected to do.

Across **different fields** you do want everything — which is why `validateAll`
collects rather than stopping.

## Curried generics — the main lesson

You would like to write:

```ts
rule<User>("name", required());
```

with `K` inferred from `"name"`. TypeScript refuses: **type arguments are all or
nothing.** Supply `User` and you must also supply `K`, which defeats the point.

The workaround is to split into two calls:

```ts
export function rulesFor<T>() {
  return function rule<K extends keyof T & string>(
    field: K,
    validator: Validator<T[K]>,
  ): FieldRule<T> { … };
}

const userRule = rulesFor<User>();   // T fixed here
userRule("name", required());        // K inferred here
```

Now `T` is fixed by the outer call and `K` is inferred by the inner one, so
`Validator<T[K]>` checks the validator against *that field's* type.

You will meet this shape in real APIs — tRPC's `initTRPC.create()`, Zustand's
`create<State>()(…)`, and various form libraries all use it for exactly this
reason. Recognising *why* the extra `()` is there is the useful part.

> `keyof T & string` rather than plain `keyof T` because `keyof` can include
> `number | symbol`, and `FieldRule.field` is a `string`.

## Where `K` goes

It vanishes from the result:

```ts
check: (subject) => validator(subject[field]),
```

The closure captures both the field name and the validator, so the returned
`FieldRule<T>` mentions neither `K` nor the field's type. That **erasure is the
point**: it lets a single `FieldRule<User>[]` hold a rule for a `string` field
next to one for a `number` field.

This is existential typing in miniature — "there exists some K, and I have
already used it". Trying to keep `K` in the result type would make the array
un-typeable.

## Common mistakes

| Mistake | What happens |
|---|---|
| `required` returning `string \| null` directly | It is a validator, not a factory; `combine` cannot use it |
| `value.length` without trimming in `minLength` | `"  ab  "` wrongly passes |
| `combine` collecting all errors | The first-error tests fail |
| `combine` returning `""` for success | `""` is falsy but not `null`; comparisons break |
| `rule<T, K>` in one call | Callers must supply both type arguments |
| `keyof T` without `& string` | `field: string` no longer accepts it |
| `validateAll` stopping at the first error | Multi-field failures under-report |

## Interview angle

> *"How would you build a composable validation layer?"*

Small factories returning a uniform function type, a `combine` that
short-circuits on the first failure, and a field binder that checks the
validator against the field's own type. Then the UX judgement: first-error per
field, all errors across fields.

> *"Why does this library make me write `create<State>()(…)` with two calls?"*

Because TypeScript has no partial type-argument inference — you cannot fix one
parameter and infer the rest. Currying lets the first call fix the explicit type
and the second infer from the arguments. Being able to explain that extra `()`
is a genuinely distinguishing answer.
