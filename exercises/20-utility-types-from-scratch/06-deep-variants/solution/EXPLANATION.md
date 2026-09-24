# 20/06 — Deep variants

## Three types, one shape

```ts
type DeepReadonly<T> = T extends Atom ? T : { readonly [K in keyof T]: DeepReadonly<T[K]> };
type DeepMutable<T>  = T extends Atom ? T : { -readonly [K in keyof T]: DeepMutable<T[K]> };
type DeepPartial<T>  = T extends Atom ? T : { [K in keyof T]?: DeepPartial<T[K]> };
```

A conditional that stops at the leaves, a homomorphic mapped type over
everything else, and a recursive call on the value type. The modifier slot is
the only thing that changes — which is the point: 20/01's four one-liners with
`DeepX<T[K]>` in place of `T[K]`.

None of these are in the standard library. Not because they are hard, but
because the leaf set is a **policy decision** that no single answer can make for
every codebase.

## Arrays and tuples are free

The instinct is to add a branch:

```ts
T extends readonly (infer E)[] ? readonly DeepReadonly<E>[] : …   // unnecessary
```

You do not need it. A **homomorphic** mapped type — one whose keys come from
`keyof T` — is special-cased by the compiler over arrays and tuples:

```ts
DeepReadonly<string[]>            // readonly string[]
DeepReadonly<[number, number]>    // readonly [number, number]
```

The mapping is applied to the element type and the array-ness is preserved,
including tuple length and element labels. That is the same rule that makes
`Readonly<string[]>` work, and hand-rolling the branch is how people
accidentally collapse a tuple into an array.

It has a flip side, and the tests pin it down:

```ts
DeepPartial<{ list: number[] }>   // { list?: (number | undefined)[] }
```

Mapping `?` over an array makes its **elements** optional, which for an array
means `| undefined` on every slot. Almost never what you want from a config
patch — `type-fest`'s `PartialDeep` special-cases arrays for exactly this
reason, with an option to choose the behaviour. Knowing that this is a choice,
rather than a bug, is the useful part.

## The leaf set is the whole design

```ts
type Atom =
  | string | number | boolean | bigint | symbol | null | undefined
  | Date | RegExp
  | ((...args: never[]) => unknown);
```

Without `Date` in that list, `DeepReadonly<Date>` maps over `Date`'s methods and
you get an object with `readonly getTime: () => number` — assignable to `Date`
in some directions, but no longer a `Date`, and `new Date()` no longer fits
where the type is expected. Without the function member, `onSave` loses its call
signature entirely: mapping over a function's keys gives `{}`, because a
function type has no enumerable properties to map.

The function member works because parameters are checked contravariantly, so
`(...args: never[]) => unknown` matches any function (20/04).

### `Map` and `Set` — what actually happens

They are deliberately *not* in the leaf set, so the tests can show the damage:

```ts
DeepReadonly<Map<string, number>>
// { readonly get: (key: string) => number | undefined;
//   readonly set: (key: string, value: number) => Map<string, number>;
//   readonly size: number; … }
```

The mapped type walked the Map's **methods**. The result is still structurally
assignable to a `Map` — `readonly` on a property does not block assignment — but
it is not the same type, and `set`, `delete` and `clear` are all still there and
still callable. The type claims the value is frozen; nothing about it is.

The fix is two more branches before the general case:

```ts
type DeepReadonly<T> =
  T extends Atom ? T
  : T extends Map<infer K, infer V> ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer U> ? ReadonlySet<DeepReadonly<U>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };
```

`ReadonlyMap` and `ReadonlySet` are in `lib.es5.d.ts` and exist precisely for
this. Every library-grade implementation has these branches, plus more for
`Promise`, `WeakMap`, typed arrays and class instances — which is why
`type-fest`'s `ReadonlyDeep` is a few hundred lines and this one is three.

## Recursion depth

Self-referential types are fine:

```ts
interface Category { name: string; children: Category[] }
DeepReadonly<Category>   // terminates
```

Conditional and mapped types expand **lazily**, so the recursive reference is
only unfolded when something asks for it. Nothing blows up.

What does blow up is recursion driven by structure that must be expanded eagerly
— long tuples, deeply nested generics, string-literal parsing (10/05) — where
you meet `Type instantiation is excessively deep and possibly infinite` at
around 50 levels, or a much earlier slowdown as each level multiplies the work.

The standard defence is a depth counter, and since TypeScript has no type-level
arithmetic you count down by indexing a tuple:

```ts
type Prev = [never, 0, 1, 2, 3, 4];

type DeepReadonlyUpTo<T, D extends Depth = 3> = D extends 0
  ? T
  : T extends Atom
    ? T
    : { readonly [K in keyof T]: DeepReadonlyUpTo<T[K], Prev[D]> };
```

`Prev[3]` is `2`. Position `0` holds `never` and is unreachable, because the
`D extends 0` branch fires first — the budget check must come before everything
else, or a zero budget still walks one level.

The same tuple trick is how people write type-level addition, `Repeat<T, N>` and
recursion guards throughout `type-fest` and `ts-toolbelt`. Worth having in your
hands even if you never ship one.

## `deepFreeze` — three details

```ts
if (typeof value !== "object" || value === null) return;   // typeof null === "object"
if (Object.isFrozen(value)) return;                        // cycle guard
Object.freeze(value);
for (const child of Object.values(value)) freeze(child);
```

1. **`typeof null === "object"`** — the oldest bug in JavaScript, and every
   recursive walk over unknown data has to handle it (02/04).
2. **The frozen check must come before the recursion.** A graph that points back
   at itself would otherwise never terminate; the test builds exactly that. It
   also makes a second `deepFreeze` call free.
3. **No cast on the return.** A mutable value is assignable to its
   deeply-readonly type — `readonly` is not enforced across assignment, and
   `string[]` is assignable to `readonly string[]`. The type change is a promise
   to the caller about what they may do with it; `Object.freeze` is the runtime
   enforcement. The two halves of the same idea, which is the neatest summary of
   what this whole section has been about.

`Object.values` covers arrays (their elements) and plain objects (own enumerable
properties) in one call. A frozen array throws on `push` in strict mode — which
is exactly the runtime counterpart of `readonly string[]` having no `push`.

## Common mistakes

| Mistake | What happens |
|---|---|
| No leaf guard at all | `Date` becomes `{}`; functions lose their call signature |
| Hand-rolled array branch | Tuples collapse to arrays, labels are lost |
| Depth check after the leaf check | A zero budget still walks one level |
| `D - 1` | No type-level arithmetic; index a tuple |
| Recursing before `Object.isFrozen` | Cyclic graphs hang or blow the stack |
| Forgetting `typeof null === "object"` | Runtime crash on a null field |
| Assuming `DeepReadonly<Map>` is safe | The mutators are still there |

## Interview angle

> *"Write `DeepPartial<T>`."*

Write the three lines, then immediately name the caveats before you are asked:
arrays get optional *elements*, `Date` and functions need a leaf guard or they
are destroyed, `Map` and `Set` need dedicated branches, and deep recursion may
need a depth counter. That list is the answer; the code is just the setup for
it. Finish with "which is why it isn't in the standard library — the leaf set is
a policy decision".

> *"How would you make an object deeply immutable?"*

Two halves that have to agree: `DeepReadonly<T>` for the compile-time promise
and a recursive `Object.freeze` for the runtime enforcement, cycle-guarded with
`Object.isFrozen`. Point out that the type alone is a convention — `readonly` is
erased and does not survive an `as` — and the freeze alone gives you no
autocomplete or feedback until the code runs. Neither is sufficient on its own,
and knowing that is the point of the question.
