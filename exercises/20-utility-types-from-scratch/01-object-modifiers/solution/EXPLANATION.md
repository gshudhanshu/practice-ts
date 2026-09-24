# 20/01 — Object modifiers

## The four one-liners

```ts
type MyPartial<T>  = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyMutable<T>  = { -readonly [K in keyof T]: T[K] };
```

The first three are **character-for-character** what ships in `lib.es5.d.ts`
(modulo the type-parameter name, which TypeScript calls `P`). There is no hidden
compiler magic behind `Partial` — it is a plain mapped type you could have
written.

Two modifier slots exist, one on each side of the key:

```ts
{ <readonly?> [K in keyof T] <?> : T[K] }
```

`+` adds, `-` removes, and `+` is the default so nobody writes it.

## Homomorphism — the word that earns the point

A mapped type is **homomorphic** when its keys come from `keyof T` directly (or
from a type parameter constrained by `keyof T` — that matters in 20/02). A
homomorphic mapped type:

1. **preserves the modifiers** it does not explicitly change;
2. **maps arrays to arrays and tuples to tuples** rather than to a plain object
   (`Readonly<string[]>` is `readonly string[]`, not `{ readonly 0: … }`);
3. **distributes over unions** of object types.

Watch it in the assertions:

```ts
type Draft = { readonly id: string; title?: string; wordCount: number };

MyPartial<Draft>  // { readonly id?: string; title?: string; wordCount?: number }
//                     ^^^^^^^^ kept, because we only asked to add `?`
MyReadonly<Draft> // { readonly id: string; readonly title?: string; … }
//                                          ^ `?` kept, we only asked for readonly
```

Now the counter-example from `exercise.ts`:

```ts
type LosesModifiers<T> = { [K in Extract<keyof T, string>]: T[K] };

LosesModifiers<Draft>
// { id: string; title: string | undefined; wordCount: number }
//   ^ readonly gone   ^ `?` gone, and `undefined` is now baked into the type
```

`Extract<keyof T, string>` produces a *computed* union. The compiler no longer
sees a structural relationship to `T`, so it has no modifiers to copy — and
`T["title"]` on an optional property is `string | undefined`, which is how the
`undefined` leaks into a now-required property.

This is the real-world bug behind "I wrote a mapped type and all my `readonly`s
vanished". If you need to filter keys, use a key-remapping `as` clause
(`[K in keyof T as …]`, 10/03) — that stays homomorphic.

## `-?` removes optionality; whether it removes `undefined` depends on a flag

```ts
MyRequired<{ a?: string }>              // { a: string }
MyRequired<{ a?: string | undefined }>  // { a: string | undefined }   ← this repo
```

With `exactOptionalPropertyTypes` on (03/03), `?` and `| undefined` are separate
facts, and `-?` only touches the first. With the flag off, TypeScript treats
every optional property as implicitly `| undefined` and `-?` strips it too, so
both lines above give `{ a: string }`. Same utility type, two behaviours,
decided by tsconfig — worth knowing before you assert what `Required` does.

## `Partial` and `Required` are not inverses

`MyRequired<MyPartial<T>>` recovers `MyRequired<T>`, not `T`: the information
about which properties were *originally* optional is destroyed by the round
trip. Type-level transformations are one-way far more often than they look.

## Why the standard library has no `Mutable`

`Readonly` has no official inverse, and this is deliberate rather than an
oversight. The TypeScript team's position is that removing `readonly` is a
declaration you should make consciously and locally, because a `Mutable<T>` in a
public API hands callers permission to mutate something the author marked as
frozen — the type-level equivalent of a `const_cast`.

In practice everyone writes it anyway (it is `Mutable` in `type-fest`,
`Writable` elsewhere), because it is genuinely needed when you build up an
object and then freeze it, or when a library over-applies `readonly`. Knowing
the argument on both sides is the interesting half of the answer.

There *is* one asymmetry worth remembering: `readonly` is not enforced across
assignment, so a mutable object is assignable to its readonly version without
any cast. `Mutable` is not a hole in the type system so much as a shortcut
through a fence that was already low.

## Why `applyPatch` needs no cast

```ts
return { ...base, ...patch };
```

The spread of an optional property is only applied when the key is present, and
`exactOptionalPropertyTypes` guarantees a present key carries a real value. So
the result really does still satisfy `MyRequired<Settings>`, and the compiler can
see it.

Turn that flag off and `{ fontSize: undefined }` becomes a legal patch that
would produce `{ fontSize: undefined }` in a type that promises `fontSize:
number` — the same code, silently wrong. This is the clearest payoff for that
flag in the whole repo.

## Common mistakes

| Mistake | What happens |
|---|---|
| `{ [K in keyof T]: T[K] \| undefined }` for `MyPartial` | Property is still required — `?` and `\| undefined` are different |
| `readonly` without `-` in `MyMutable` | Adds the modifier instead of removing it |
| Mapping over `Extract<keyof T, string>` "to be safe" | Silently drops every `readonly` and `?` |
| `Object.assign(base, patch)` in TODO 5 | Mutates `base`; the test catches it |
| Truthiness (`patch.fontSize ? … : …`) | `0` and `false` are valid values and would be lost |
| Reaching for `Partial<T>` to define `MyPartial<T>` | Passes the test, answers nothing |

## Interview angle

> *"Implement `Partial<T>`."*

Write the line, then keep going for one more sentence: *"it's homomorphic —
because the keys come straight from `keyof T`, the original `readonly` and `?`
modifiers are preserved, and it maps arrays to arrays instead of to a plain
object."* That single sentence is the difference between "has seen a mapped
type" and "understands mapped types".

If they push: `Required` is `-?`, `Readonly` is `readonly`, and the inverse of
`Readonly` is `-readonly`, which the standard library deliberately does not
ship.

> *"What's the difference between `{ a?: string }` and `{ a: string | undefined }`?"*

The first says the key may be absent; the second says the key must be present
and may hold `undefined`. `exactOptionalPropertyTypes` is the flag that keeps
them apart — without it the compiler blurs the two, which is why `Required<T>`
behaves differently between codebases. Mention that `?` also affects
`Object.keys`, spread and `in` checks at runtime, while `| undefined` does not.
