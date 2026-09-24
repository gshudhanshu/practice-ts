# 20/03 — Union filters

## Three definitions, one rule

```ts
type MyExclude<T, U>     = T extends U ? never : T;
type MyExtract<T, U>     = T extends U ? T : never;
type MyNonNullable<T>    = T extends null | undefined ? never : T;
```

The first two are the standard library's, verbatim. All three work only because
of **distribution**:

```ts
MyExclude<"a" | "b", "a">
// ("a" extends "a" ? never : "a") | ("b" extends "a" ? never : "b")
// never | "b"
// "b"
```

Two facts combine. First, a conditional over a *naked* type parameter runs once
per union member. Second, **`never` is the identity element of a union** —
`never | "b"` collapses to `"b"`, because a union is a set and `never` is the
empty set. So "map a member to `never`" means "remove it", exactly as it does in
a mapped type's `as` clause (10/03).

Say that out loud in an interview and you have answered the question behind the
question.

## `never` is the empty union — and it bites

```ts
type NaiveIsNever<T> = T extends never ? true : false;
NaiveIsNever<never>   // never  ← not `true`
NaiveIsNever<string>  // false
```

Distribution over a union with **no members** produces no results, so the
conditional never evaluates either branch and the whole thing collapses to
`never`. The fix is to stop `T` being naked:

```ts
type HasMembers<T> = [T] extends [never] ? false : true;
```

Wrapping both sides in a one-element tuple makes the compiler evaluate the
conditional once, against the whole type. Any wrapper would do; the tuple is the
idiom everyone recognises.

This matters in practice whenever you filter a union and then need to branch on
whether anything survived — exhaustiveness helpers, "did this `Extract` find
anything?" guards, and most type-level error reporting.

## `boolean` is a union too

```ts
MyExclude<string | number | boolean, boolean>  // string | number
```

`boolean` is `true | false` internally, so it distributes into two members and
both are dropped. That is what you want here, but it is the same mechanism
behind the classic surprise:

```ts
type Wrap<T> = T extends unknown ? T[] : never;
Wrap<boolean>   // true[] | false[]   ← not boolean[]
```

Whenever a conditional gives you "two of something" from a boolean, this is why.

## Assignability, not identity

```ts
MyExclude<"a" | "b" | 1, string>   // 1
MyExtract<Shape, { kind: "circle" }>  // Circle
```

The check is `extends` — plain assignability. So a wide type filters out every
literal assignable to it, and a *partial* object shape is enough to select a
union member. That second one is genuinely useful: `Extract<Action, { type:
"submit" }>` picks one variant out of a discriminated union without you having
to name its type.

It also explains why `Extract<Level, "trace">` is `never` rather than an error.
Nothing matched, so nothing came back. See 20/05.

## Why the standard library's `NonNullable` is `T & {}`

The conditional version above is what shipped until TypeScript 4.8. Today it is:

```ts
type NonNullable<T> = T & {};
```

`{}` means "anything except `null` and `undefined`", so intersecting with it
removes exactly those two members and nothing else. Same answer for every
concrete input — but a very different type *expression*, and that is the point:

```ts
function f<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) throw new Error("nullish");
  return value;              // ✅ compiles
}

function g<T>(value: T): MyNonNullable<T> {
  if (value === null || value === undefined) throw new Error("nullish");
  return value;              // ❌ Type 'T & {}' is not assignable to 'MyNonNullable<T>'
}
```

Narrowing a value of generic type `T` by a nullish check gives it the type
`T & {}` — so the intersection form matches what narrowing already produces,
while the conditional form is **deferred** while `T` is unresolved and cannot be
checked against anything (10/04, 10/06). Before 4.8 that function needed a cast.

This is the single best example in the standard library of a lesson worth
carrying: **when a utility type will be used inside generic code, prefer a form
the compiler can evaluate eagerly — an intersection or an indexed access — over
a conditional.**

(One wrinkle: `Equal<string & {}, string>` is `false`, so the two forms are not
*identical* types even though they accept the same values. For a union input
they do collapse to the same thing, which is why the test can compare your
version against the built-in.)

## `compact` — the runtime half

```ts
tags.filter((tag): tag is string => tag !== null && tag !== undefined);
```

`filter` has a narrowing overload keyed on a type predicate, which is what turns
`MaybeTag[]` into `string[]` with no cast. TypeScript 5.5 and later can infer
that predicate from the body, so the annotation is optional — but explicit is
better when the function is the public one.

`!= null` (loose) catches both `null` and `undefined` in one check (05/04).
Truthiness does not: `""`, `0` and `false` are values, and the test proves it.

## Common mistakes

| Mistake | What happens |
|---|---|
| `[T] extends [U] ? never : T` for `MyExclude` | Distribution off — the whole union is kept or dropped as one |
| Expecting `T extends never` to detect `never` | Always `never`, never `true` |
| Forgetting `boolean` splits into `true \| false` | Surprise unions in the result |
| `Extract<T, U>` with a `U` that is not in `T` | Silently `never`, not an error |
| `tags.filter(Boolean)` | Drops `""`; and the type stays `MaybeTag[]` |
| Using `NonNullable` inside generic code before 4.8 semantics | The deferred conditional needs a cast |

## Interview angle

> *"Implement `Exclude<T, U>`."*

`T extends U ? never : T` — then immediately explain *why* it filters: the
conditional distributes over the union, and members mapped to `never` vanish
because `never` is the empty union. One line of code, two sentences of
mechanism; the second half is what is actually being marked.

> *"Why doesn't `T extends never ? true : false` work?"*

Because `never` is the union with no members, so there is nothing to distribute
over and the conditional resolves to `never` without picking a branch. Use
`[T] extends [never]` to turn distribution off. If you can also say when you
*want* distribution — `Exclude`, `Extract`, `DistributiveOmit` — you have shown
you understand it rather than memorised a workaround.
