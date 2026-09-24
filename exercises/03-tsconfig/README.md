# Section 03 — The compiler & tsconfig

Maps to `03-tsconfig` in the course repo.

Most courses cover `tsconfig.json` as a chore. It is actually one of the
highest-leverage things you control: the difference between a codebase where the
compiler catches bugs and one where it nods along.

Four exercises on the flags that matter — three written *against* strict
settings so you feel what they buy you, and one that drills the "which flag
would have caught this bug?" question directly.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [strictNullChecks](01-strict-null-checks/) | Drill | 15 min | `?.`, `??`, why `!` is a smell, inferred type predicates |
| 02 | [noUncheckedIndexedAccess](02-unchecked-indexed-access/) | Drill → Core | 20 min | `T \| undefined` on index access, and how to stop fighting it |
| 03 | [exactOptionalPropertyTypes](03-exact-optional-property-types/) | Core | 20 min | Absent vs present-and-undefined; the config-merge bug |
| 04 | [Configure a project](04-configure-a-project/) | **Challenge** | 25 min | What `strict` covers, what it misses, flag-to-bug diagnosis |

**Run one:** `npm run check 03/02` · **Run the section:** `npm run check 03`

## What to take away

- `"strict": true` is exactly **eight** flags. Know them.
- The valuable ones it does **not** include: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`.
- They are excluded because `strict` is curated to stay *adoptable*, not because
  they are unimportant.
- `!` is not a check. It is you telling the compiler to be quiet.
- Migration judgement matters more than reciting the flag list: enable sub-flags
  one at a time, land each as its own PR.

## Interview questions this section prepares you for

- Which compiler options do you enable beyond `strict`, and why?
- What does `strictNullChecks` actually change?
- A junior turns on `strict` and gets 2,000 errors — what do you tell them?
- What's the difference between `{ a?: string }` and `{ a: string | undefined }`?
- Here's a bug that reached production. Which flag would have caught it?
