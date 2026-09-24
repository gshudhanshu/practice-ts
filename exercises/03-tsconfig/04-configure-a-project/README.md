# 03/04 — CHALLENGE: configure a project properly

**Tier:** Challenge · **Time:** ~25 min · **Course section:** 03 — The compiler & tsconfig

---

## Why this exercise exists

Nobody hands you a blank `tsconfig.json` in an interview. What they *do* ask:

- *"Which compiler options do you turn on, and why?"*
- *"Here's a bug that reached production. Which flag would have caught it?"*
- *"What does `strict` actually enable?"*

Most candidates can say "strict: true" and stop. This exercise is the next
level: knowing precisely what `strict` covers, and — more usefully — what it
**doesn't**.

## Your task

Open `exercise.ts` and resolve all four TODOs.

### TODO 1 & 2 — what `strict` covers

`"strict": true` is shorthand for exactly **eight** flags. List them in
`STRICT_IMPLIED_FLAGS`, then implement `isImpliedByStrict`.

The valuable ones it does *not* include are in the test — those are the flags
worth naming in an interview.

### TODO 3 — diagnose the bug

| Problem | Symptom |
|---|---|
| `index-access-crashed` | `const first = items[0]; first.name` threw on an empty array |
| `spread-erased-a-default` | `{ retries: undefined }` in a patch wiped out the default |
| `orphaned-override` | A base method was renamed; the subclass "override" became dead code |
| `switch-fell-through` | A missing `break` let one case run into the next |
| `parameter-was-implicitly-any` | An unannotated parameter silently became `any` |
| `null-dereference` | `user.name.toUpperCase()` threw because `name` was null |
| `catch-variable-assumed-to-be-an-error` | `catch (err) { err.message }` with no type check |

Return the one flag that would have caught each at compile time.

### TODO 4 — the config

`RECOMMENDED_COMPILER_OPTIONS` must equal exactly:

```jsonc
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler",

  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,

  "verbatimModuleSyntax": true,
  "isolatedModules": true,

  "skipLibCheck": true,
  "forceConsistentCasingInFileNames": true
}
```

Type it out rather than copy-pasting — the point is to know *why* each line is
there. `solution/EXPLANATION.md` justifies every one.

## Rules

- Do not edit `exercise.test.ts`.
- `STRICT_IMPLIED_FLAGS` must hold literal types, not widened `string`, and
  must be readonly.

## Done when

```bash
npm run check 03/04
```

<details>
<summary>Hint 1 — keeping the flag list literal AND checked</summary>

`as const` keeps the literals; `satisfies readonly CompilerFlag[]` makes the
compiler verify every entry is a real flag **without** widening the type. This
combination — `as const satisfies T` — is the modern idiom for exactly this
situation.

A plain annotation (`const X: readonly CompilerFlag[] = [...]`) would widen the
element type back to the full union and fail the test.
</details>

<details>
<summary>Hint 2 — TODO 3 without a switch</summary>

`Record<Problem, CompilerFlag>` gives you exhaustiveness for free: leave one
problem out and the object literal fails to compile. Then just index it.
</details>

<details>
<summary>Hint 3 — <code>.includes</code> refuses my flag again</summary>

Same trap as 02/03: a readonly tuple of literals has an `includes` that only
accepts those literals. Use `.some((x) => x === flag)`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it
justifies every line of the config, explains `verbatimModuleSyntax` and
`isolatedModules` (which trip people up), and covers what `skipLibCheck`
genuinely costs you.
