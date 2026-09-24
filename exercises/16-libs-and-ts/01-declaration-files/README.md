# 16/01 — declaration files

**Tier:** Core · **Time:** ~30 min · **Course section:** 16 — Third-party libraries

---

## Why this exercise exists

Sooner or later you `import` something that has no types. The dependency is
plain JavaScript, `@types/…` does not exist, and `noImplicitAny` is shouting at
you. The fix is a **declaration file**: a `.d.ts` that describes what the
JavaScript contains.

The mechanism is small. The judgement is not:

> A `.d.ts` emits nothing and checks nothing. `declare` is a **promise** you make
> on behalf of code the compiler cannot see. Get it wrong and you have not
> written a bug — you have written a bug that TypeScript will now defend.

This exercise makes you write one for a real (small, deliberately awkward)
JavaScript module, and one of its functions does not do what its name suggests.

## Your task

`legacy-slug.js` is the untyped dependency. **Read it first** — its behaviour is
the only specification you have. `legacy-slug.d.ts` wires your type to the
module specifier; you do not edit either file.

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `LegacySlug` — the module's real shape, all four members |
| 2 | `slugTitle` and `firstTag` — use the module through your declaration |
| 3 | `declare global` for `__LEGACY_SLUG__`, then `slugRuntime` |
| 4 | `typeSourceFor` — where a package's types come from |
| 5 | `diagnose` — five ways a declaration file goes wrong |

### TODO 2 — expected behaviour

| Call | Result |
|---|---|
| `slugTitle("Hello, World!", 8)` | `"hello-wo..."` |
| `slugTitle("Hello", 20)` | `"hello"` |
| `firstTag("news, ts")` | `"news"` |
| `firstTag("")` | `null` |

### TODO 5 — the mapping

| Symptom | Meaning |
|---|---|
| `the-import-is-typed-any-and-noImplicitAny-reports-it` | Nothing describes the module at all |
| `tsc-is-happy-and-the-property-is-undefined-at-runtime` | The declaration claims something untrue |
| `the-declarations-describe-an-older-major-version-of-the-package` | `@types/x` is two majors behind `x` |
| `declare-module-compiles-but-node-cannot-resolve-the-import` | Types without a runtime module behind them |
| `editing-the-d-ts-changed-nothing-in-the-bundle` | …which is exactly what should happen |

## Rules

- Do not edit `exercise.test.ts`, `legacy-slug.js` or `legacy-slug.d.ts`.
- No `any`, no `as`, no `!`. In particular, do not "fix" an inconvenient
  `undefined` by declaring it away.
- Describe the JavaScript as it **is**. The tests exercise the awkward case.

## Done when

```bash
npm run check 16/01
```

<details>
<summary>Hint 1 — where the shape actually goes in real life</summary>

In a real project you write the block itself:

```ts
// src/types/legacy-slug.d.ts
declare module "legacy-slug" {
  export function slugify(input: string): string;
  export function tags(csv: string): string[] | undefined;
}
```

Here the shape lives in `exercise.ts` and `legacy-slug.d.ts` forwards to it, so
the test can grade what you wrote. That is the only artificial part; everything
else — including the fact that nothing checks you — is exactly the real thing.
</details>

<details>
<summary>Hint 2 — read <code>tags</code> again</summary>

```js
return parts.length === 0 ? undefined : parts;
```

It does not return an empty array. Whatever you type it as, the runtime will do
that. The honest declaration forces `firstTag` to handle it, which is the entire
point of the exercise.
</details>

<details>
<summary>Hint 3 — two undefineds in one line</summary>

`firstTag` has to survive both the missing array and the missing element
(`noUncheckedIndexedAccess` makes `list[0]` a `string | undefined` even for a
`string[]`). Optional chaining handles both at once: `list?.[0] ?? null`.
</details>

<details>
<summary>Hint 4 — <code>declare global</code></summary>

```ts
declare global {
  var __SOMETHING__: SomeType;
}
```

It only works in a file that is already a module — one with a top-level `import`
or `export`. `var` is what puts the name on `globalThis`; `const` and `let`
declare a global *binding* that `globalThis.x` cannot reach, which is a fun
half-hour to lose.
</details>

<details>
<summary>Hint 5 — TODO 5's last row is not a bug</summary>

Editing a `.d.ts` and seeing no change in the bundle is the system working.
Declarations describe; they never produce. If you needed the change to show up
at runtime, you were editing the wrong file.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
`declare module` vs `declare global`, the `var`-only rule, how TypeScript decides
where a package's types live, and how to type a dependency incrementally rather
than all at once.

Next: [16/02 — augmenting library types](../02-augmenting-library-types/).
