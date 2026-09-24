# 16/04 — A typed facade over an untyped dependency

## `any` versus `unknown`, precisely

| | `any` | `unknown` |
|---|---|---|
| Assign anything **to** it | yes | yes |
| Assign it **to** anything | yes | no |
| Read a property | yes, unchecked | no, narrow first |
| Call it | yes | no |
| Spreads to derived values | yes | no |

Both are "I do not know what this is". Only one of them makes you find out.

That table is the entire design of this exercise. The vendor's `any` flows into
`callVendor`, and the moment it is assigned to an `unknown` return type it stops
being contagious — every caller above must narrow before it can do anything at
all. No cast is needed in either direction: `any` is assignable to `unknown`
because everything is.

## Why the boundary is one function

`callVendor` exists so that "where does the untyped data enter?" has a
one-word answer. Three practical consequences:

- **Grep-ability.** One import of the vendor, in one file. When the SDK changes,
  there is exactly one place to look.
- **Testability.** The facade's tests do not need the vendor mocked in ten
  places.
- **Honesty.** If the boundary were spread across `getFlag`, `listFlags` and
  `setFlag`, the `any` would be in three places and would eventually be four.

The same shape appears at every real boundary — `fetch` responses, `JSON.parse`,
`localStorage`, `process.env`, message-queue payloads. 02/06 built the smallest
version of it; this is the same move around a whole dependency.

## Two shapes, not one

```ts
type RawFlag = { key: string; value: boolean; updated_at: string };  // theirs
type Flag    = { key: string; value: boolean; updatedAt: string };   // yours
```

It is tempting to use one type and live with `updated_at`. Don't:

- The vendor's spelling then appears in every component in your application, and
  renaming it later is a refactor across the codebase rather than one function.
- When the vendor changes `updated_at` to `updatedAt` in v3, `toFlag` is the
  only thing that changes.
- The domain type can be *better* than the wire type — a `Date` instead of a
  string, a branded id, a required field the wire leaves optional.

The translation function is the seam. Keep it boring and keep it in one place.

## `Array.isArray` puts `any` back

```ts
declare function isArray(arg: any): arg is any[];
```

Narrow an `unknown` with it and you have an `any[]` — every element is `any`, and
the containment you just built has a hole in it. The fix is three lines:

```ts
function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
```

Then `raw.filter(isRawFlag)` gives `RawFlag[]` through `filter`'s type-predicate
overload, and the junk and the uncertainty leave together.

Worth knowing why the lib declaration is like that: `arg is unknown[]` would
break the extremely common `if (Array.isArray(x)) x.map(…)` on an already-typed
value. It is a deliberate ergonomics-versus-soundness trade in the standard
library, and one of the few places you should second-guess it.

## Validate, then decide what "invalid" means

`isRawFlag` answers "is this a flag?". It does not decide what to do about a
`no`. That is the caller's job, and each caller answers differently:

| Caller | Invalid input becomes |
|---|---|
| `getFlag` | `null` — a missing flag and a malformed one are the same to a caller |
| `listFlags` | dropped — one bad row must not lose the other five |
| `setFlag` | `{ ok: false, reason: … }` — a write that may not have happened is not a success |

Dropping bad rows silently is a real decision with a real cost: nobody finds out
the vendor is sending junk. In production you would log it. What you must not do
is let it through, and what you should not do is throw — one malformed row
should not take down a page that renders five good ones.

## Where a schema library takes over

By the fourth endpoint, hand-written predicates start to drift from the types
they claim to check. Zod, Valibot and ArkType invert the dependency:

```ts
const RawFlagSchema = z.object({
  key: z.string(),
  value: z.boolean(),
  updated_at: z.string(),
});
type RawFlag = z.infer<typeof RawFlagSchema>;

const flag = RawFlagSchema.safeParse(callVendor("fetchFlag", key));
```

The type is *derived from* the validator, so they cannot disagree. Everything
else in this exercise stays exactly the same — the boundary, the translation,
the decision about what invalid means. That is worth saying in an interview: a
schema library replaces the predicate, not the architecture.

## Common mistakes

| Mistake | What happens |
|---|---|
| `callVendor` returning `any` | `IsAny` assertion fails; nothing downstream is checked |
| Importing the vendor in `getFlag` too | Compiles, and the boundary is now three places |
| Narrowing with `Array.isArray` alone | Elements are `any`; the containment leaks |
| `raw as RawFlag` after a `typeof raw === "object"` check | Compiles; the junk row reaches your UI |
| Reusing `RawFlag` as the domain type | `updated_at` spreads through the application |
| Treating `ok: 1` as truthy without checking the shape | A bare `"accepted"` string also passes a truthy test |
| Throwing on a malformed row in `listFlags` | One bad row breaks the whole list |

## Interview angle

> *"A dependency has no types (or terrible ones). How do you use it safely?"*

Wrap it. One module imports it, and that module's functions return `unknown`,
not `any` — `any` is contagious and `unknown` forces a check. Validate at that
boundary with type predicates or a schema library, translate the wire shape into
a domain type so the vendor's naming does not spread, and decide per call site
what invalid data means: `null`, a dropped row, or a failed result. Then the
line that lands it: the goal is not to remove `any` from the codebase, it is to
make sure `any` never crosses a module boundary.

> *"What's the difference between `any` and `unknown`?"*

Both accept anything. `any` is assignable *to* anything and spreads through
every value derived from it; `unknown` is assignable to nothing until it has
been narrowed. So `any` disables the compiler for everything downstream, while
`unknown` forces exactly one check at the boundary. Any API that returns `any` —
`JSON.parse`, most untyped SDKs — should be wrapped in one that returns
`unknown`.
