# 03/01 — Living with `strictNullChecks`

## What the flag actually changes

Without `strictNullChecks`, `null` and `undefined` are assignable to *every*
type:

```ts
let name: string = null;   // no error with the flag off
name.toUpperCase();        // compiles, crashes at runtime
```

With it on, `string` means a string, and "possibly missing" must be written
down: `string | null`, `string | undefined`, or an optional property. The
compiler then refuses every unchecked dereference.

It is part of `strict`, so you get it by default in any modern setup. The only
codebases that disable it are old ones mid-migration — and "we turned off
`strictNullChecks`" is a red flag worth asking about in an interview.

## The three operators

| | Name | Fires on | Safe? |
|---|---|---|---|
| `?.` | optional chaining | `null`, `undefined` | yes |
| `??` | nullish coalescing | `null`, `undefined` | yes |
| `!` | non-null assertion | — | **no** |

### `?.` short-circuits the *whole* chain

```ts
person?.address?.city
```

If `person` is nullish the entire expression is `undefined` — `address` is never
evaluated. That is why `cityOf` needs no nesting. It also works for calls
(`fn?.()`) and index access (`arr?.[0]`).

### `??` vs `||` (again, because it matters)

`??` fires only on `null`/`undefined`; `||` also fires on `0`, `""`, `NaN` and
`false`. In `safeLength`, `value?.length ?? 0` is correct — and `||` would
happen to give the same answer here, which is exactly how the habit forms and
then bites you somewhere it matters.

### `!` — the one to avoid

`person!.address!.city!` compiles and is erased entirely at runtime. It is not a
check; it is you telling the compiler to be quiet. Every `!` is an unproven
claim, and it is the most common way a "fully typed" codebase still throws
`Cannot read properties of undefined`.

Legitimate uses are rare and local: a value you just assigned in the same
function, or a class field initialised by a framework (where `!` on the
*declaration* is the documented pattern). Everywhere else, narrow instead. This
repo bans it in exercise rules for that reason.

## Inferred type predicates (TypeScript 5.5+)

```ts
values.filter((value) => value != null);   // string[]
```

Before 5.5, this returned `(string | null | undefined)[]` and everyone wrote
either an explicit predicate or a cast:

```ts
values.filter((v): v is string => v != null);   // the old way
values.filter(Boolean) as string[];             // the bad old way
```

Now the compiler analyses simple callbacks and infers the predicate itself. The
conditions: a single `return` expression (or a body whose returns all narrow the
same parameter), no mutation of the parameter, and the narrowed type must be
inferable. Complex bodies still need the explicit form.

Note that `.filter(Boolean)` still does **not** narrow — `Boolean` is typed as
returning `boolean`, not a predicate — and it would also drop `""` and `0`,
which is why the test pins `""` as a value that must survive `compact`.

## Common mistakes

| Mistake | What happens |
|---|---|
| `if (value)` instead of `value != null` | `""` and `0` are wrongly treated as missing |
| `.filter(Boolean)` in `compact` | `""` is dropped; the type stays unnarrowed |
| `as string[]` after filtering | Compiles, but you asserted instead of proving |
| `person!.address!.city` | Compiles; throws at runtime for `cityOf(null)` |
| Nested `if` pyramid in `cityOf` | Correct, just far more code than `?.` needs |
| `word[0].toUpperCase()` | Compile error under `noUncheckedIndexedAccess` |

## Interview angle

> *"What does `strictNullChecks` do, and would you turn it on in a legacy
> codebase?"*

Say what it does, then show migration judgement: turning it on repo-wide in one
commit produces thousands of errors nobody will triage. The realistic path is
file-by-file — TypeScript has no per-file switch for it, so teams typically
enable it in a separate `tsconfig` covering a growing subset of files, or use
`ts-strictify`-style tooling in CI to require it only for changed files.

> *"When is `!` acceptable?"*

Rarely, and always with a comment explaining what you know that the compiler
does not. If the answer is "nothing, it was just noisy", that is a bug waiting
to happen. Framework-initialised class fields are the one broadly accepted case.
