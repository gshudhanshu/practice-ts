# 05/02 — Spread & rest

## Rest vs spread — same `...`, opposite jobs

```ts
function sum(...values: number[]) {}   // REST   — collects arguments into an array
Math.max(...values);                   // SPREAD — expands an array into arguments
```

Rest appears in a **binding position** (parameter list, destructuring pattern);
spread appears in a **value position** (call arguments, array literal, object
literal). Rest gathers, spread scatters.

## Override order

```ts
{ ...user, name }   // name wins        <- what you want
{ name, ...user }   // user.name wins   <- silently does nothing
```

Object literals apply keys left to right, so the last one wins. The second form
is a real bug that reads as correct, and it is worth training your eye to spot:
**the thing you are overriding goes after the spread.**

The same rule powers config merging: `{ ...defaults, ...options }`.

## Spread is shallow — the whole point of TODO 5

```ts
const copy = { ...state };
copy.user === state.user;   // true — SAME object
```

Spread copies own enumerable properties one level deep. Nested objects are
copied **by reference**, so mutating `copy.user.address.city` also changes
`state`. That is why the immutable update needs a spread at every level on the
path:

```ts
{
  ...state,                        // new state
  user: {
    ...state.user,                 // new user
    address: {
      ...state.user.address,       // new address
      city,                        // the actual change
    },
  },
  version: state.version + 1,
}
```

Objects **not** on that path (there are none here, but imagine `state.settings`)
stay shared by reference — which is exactly what you want. That structural
sharing is what makes `prevProps.user === nextProps.user` a valid, cheap
"did this change?" test in React and why `React.memo` and `useMemo` work at all.

### When nested spreads stop scaling

Three levels is about the limit before this becomes unreadable and easy to get
wrong. Real codebases reach for:

- **Immer** (`produce(state, draft => { draft.user.address.city = city })`) —
  you write mutations, it produces an immutable result with structural sharing.
  This is what Redux Toolkit uses internally.
- **A flatter state shape**, which is usually the better fix.

Knowing the manual version matters anyway: it is what those libraries do, and
it is what an interviewer will ask you to write on a whiteboard.

### What about `structuredClone`?

`structuredClone(state)` deep-copies, which *works* but throws away structural
sharing — every reference changes, so every memoised consumer re-renders. It
also cannot clone functions, DOM nodes or class instances. Deep-cloning to
achieve immutability is usually the wrong instinct.

## `Math.max()` and the empty case

```ts
Math.max();     // -Infinity
Math.min();     //  Infinity
```

Those are the identity elements — mathematically principled, practically a
footgun. `maxOf([])` returning `-Infinity` would flow silently into a
comparison somewhere far away.

A second reason to guard: `Math.max(...values)` passes every element as a
separate argument, so a very large array can exceed the engine's argument limit
and throw `RangeError: Maximum call stack size exceeded` (in practice, around
100k+ elements). `values.reduce((a, b) => Math.max(a, b))` has no such limit.

## `Set` for dedupe

```ts
[...new Set(lists.flat())];
```

`Set` keeps **insertion order** (guaranteed by the spec) and dedupes with
SameValueZero equality. That gives first-seen order for free. It compares by
identity, so it dedupes primitives but not structurally-equal objects.

`.flat()` defaults to one level of flattening — exactly right for an
array-of-arrays. `.flat(Infinity)` goes all the way down.

## Spread and `undefined`

Two behaviours worth knowing, both of which caught us in 03/03:

```ts
{ ...{ a: 1 }, ...{ a: undefined } }   // { a: undefined } — the key IS copied
{ ...null, ...undefined }              // {} — spreading nullish is a no-op, not an error
```

The first is why naive config merging destroys defaults. The second is
occasionally useful: `{ ...base, ...(flag ? extra : undefined) }` is a legal
conditional spread.

## Common mistakes

| Mistake | What happens |
|---|---|
| `{ name, ...user }` | The original name wins; the rename test fails |
| One spread in `updateCity` | The nested-reference test fails, and the original mutates |
| `Math.max(...values)` with no guard | `maxOf([])` returns `-Infinity` |
| `lists.flat(Infinity)` | Works here, but flattens more than intended in general |
| `sum(values: number[])` | Not a rest parameter; `_sumParams` fails |
| `structuredClone` in TODO 5 | Passes the value tests, breaks structural sharing, and is banned by the rules |

## Interview angle

> *"How do you update a nested value immutably?"*

Spread at every level on the path, share everything else. Then add the two
things that show depth: shallow copies are what make reference-equality checks
(`React.memo`, `useMemo`) work, and past ~3 levels the industry reaches for
Immer rather than hand-writing it.

> *"What's the difference between shallow and deep copy — and which do you want?"*

Usually **shallow**, applied along the changed path. Deep copying is slower,
breaks identity for every consumer, and cannot handle functions or class
instances. People often reflexively answer "deep copy is safer"; explaining why
it is usually worse is the differentiator.
