# 03/02 — `noUncheckedIndexedAccess`

## What it changes

Exactly one thing: **indexed reads gain `| undefined`.**

```ts
values[0]     // string   ->  string | undefined
record[key]   // number   ->  number | undefined
values.at(0)  // already string | undefined, flag or not
```

Writes are unaffected — `counts[word] = 1` still works normally.

## The patterns that make it painless

### 1. Iterate, do not index

```ts
for (const value of values) { … }   // value: string
values.forEach((value) => …);       // value: string
```

`for...of` and the array methods yield the **element type**. The flag only
touches explicit `[i]` access, so most well-written code never notices it. That
is why `sumAll` needs nothing special.

### 2. Reach for the right array method

`chunk` uses `.slice(i, i + size)`, which returns `number[]` — no element access
at all. Whenever the flag feels like it is fighting you, there is usually a
method that expresses the intent more directly.

### 3. Narrow once into a local

```ts
const a = left[i];
if (a === undefined) continue;
// a: string from here on
```

Narrowing attaches to the **local**, not to `left[i]`. Re-reading `left[i]`
later re-widens it, because the compiler cannot know the array was not mutated
in between.

### Why `i < length` does not help

TypeScript does not model the relationship between a loop counter and an array's
length — that needs dependent types, which it does not have. So inside a
perfectly correct `for (let i = 0; i < arr.length; i++)`, `arr[i]` is *still*
`T | undefined`.

That feels pedantic until you remember that `arr` could be sparse, or mutated
inside the loop body. The one-line guard is cheap; `arr[i]!` is a lie that
happens to be true today.

## What the flag does NOT catch

Worth knowing, because it is the honest caveat:

```ts
const [first] = values;        // string | undefined  — covered
const { a } = record;          // covered for index signatures
values.map((v) => v.length);   // v is string — callbacks are unaffected

type T = Record<string, number>["missing"];  // still `number` at the TYPE level
```

The flag applies to **expressions**, not to indexed *access types*. And it does
nothing for objects with declared keys — `person.name` on a `{ name: string }`
is `string`, correctly, because that key is declared to exist.

## Adopting it in an existing codebase

Turning it on in a large repo produces a lot of errors at once, nearly all of
them in three shapes: `arr[0]`, `record[key]`, and destructuring. The practical
route:

1. Turn it on and count. If it is under a few hundred, just fix them.
2. Fix by **pattern**, not by file — convert index loops to `for...of` first,
   which usually removes a third of them for free.
3. Resist a codemod that appends `!`. That converts a compile error into a
   runtime error and wastes the whole exercise.

## Common mistakes

| Mistake | What happens |
|---|---|
| `at(): string` with `values[i]!` | Type assertion fails; out-of-range tests break |
| Indexing inside `zip` without a guard | Compile error, or `!` and a lie |
| `counts[word] + 1` | Compile error — `undefined + 1` is not allowed |
| `counts[word]! + 1` | Compiles, produces `NaN` for the first occurrence |
| Building `chunk` with a nested index loop | Works, but needs guards `.slice` does not |
| Forgetting the `size <= 0` guard | Infinite loop — the test will hang |

## Interview angle

> *"Which compiler flags would you enable beyond `strict`?"*

A strong, specific answer: `noUncheckedIndexedAccess` (this one),
`exactOptionalPropertyTypes` (03/03), `noImplicitOverride`,
`noFallthroughCasesInSwitch`, and `verbatimModuleSyntax` for modern bundlers.
Then add the judgement: `noUncheckedIndexedAccess` is the one with real
adoption cost, so on a legacy codebase you enable it on new code first.

> *"Why isn't it part of `strict`?"*

Because `strict` is meant to be adoptable, and this flag flags a very large
amount of *correct-in-practice* code — every bounded loop. The TypeScript team
keeps flags out of `strict` when the false-positive rate would stop people
upgrading. Knowing that distinction shows you understand `strict` as a curated
set rather than "all the checks".
