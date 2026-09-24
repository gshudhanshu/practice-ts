# 15/03 — CHALLENGE: configure TypeScript for a bundler

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 15 — Build tools & Vite

---

## Why this exercise exists

[03/04](../../03-tsconfig/04-configure-a-project/) covered the **safety** half of
a tsconfig: which strictness flags you enable and which bug each one catches. Do
that exercise first. This one says nothing about `strict` on purpose.

This is the other half — **emit and resolution** — and it exists because in a
Vite project `tsc` never writes a single file. That fact rewrites most of the
config, and the question behind it is the one interviewers actually ask:

> *"Walk me through your build. Who does what?"*

The answer is a division of labour: **tsc type-checks, the bundler compiles.**
Everything in `APP_COMPILER_OPTIONS` follows from it.

## Your task

Open `exercise.ts` and resolve all five TODOs.

### TODO 1 — the app config

`APP_COMPILER_OPTIONS` must equal exactly:

```jsonc
{
  "target": "ES2022",
  "lib": ["ES2022", "DOM", "DOM.Iterable"],

  "module": "ESNext",
  "moduleResolution": "bundler",
  "moduleDetection": "force",
  "types": [],

  "noEmit": true,
  "isolatedModules": true,
  "verbatimModuleSyntax": true,

  "resolveJsonModule": true,
  "skipLibCheck": true
}
```

Key order does not matter, but `lib` is a tuple — its order does.

### TODO 2 — the library config

The same repo also publishes a package that Node will `import`. Six things flip:

```jsonc
{
  "target": "ES2022",
  "lib": ["ES2022"],

  "module": "nodenext",
  "moduleResolution": "nodenext",
  "types": ["node"],

  "noEmit": false,
  "declaration": true,
  "declarationMap": true,
  "sourceMap": true,
  "outDir": "dist",
  "rootDir": "src",

  "isolatedModules": true,
  "verbatimModuleSyntax": true,
  "skipLibCheck": true
}
```

Note what did **not** change: `isolatedModules` and `verbatimModuleSyntax` stay
on even though tsc is doing the emit, because your consumers' bundlers will hit
the same constructs.

### TODO 3 — who does what

Six jobs, each owned by `"tsc"` or `"bundler"`. The rule is simple once you see
it, and stating it is worth more in an interview than the six answers.

### TODOs 4 & 5 — the same knowledge, both directions

`reasonFor` maps an option to why it is there. `optionForSymptom` maps a bug
report to the option that would have prevented it — which is how the question
actually arrives.

| Symptom | Meaning |
|---|---|
| `tsc-wrote-javascript-next-to-my-sources` | `.js` files appeared beside every `.ts` |
| `an-import-with-only-side-effects-vanished-from-the-bundle` | A polyfill import was elided |
| `the-bundle-failed-on-a-re-exported-type` | `does not provide an export named …` |
| `tsc-resolves-a-package-that-vite-cannot-find` | Green build, broken dev server |
| `globals-from-an-unrelated-types-package-are-in-scope` | Another runner's `describe`/`it` autocompleted |
| `document-is-not-a-known-name-in-a-browser-project` | `Cannot find name 'document'` |

## Rules

- Do not edit `exercise.test.ts`.
- Both config objects must be `as const`. A config that widens its own values to
  `string` has thrown away the only compile-time checking it had.
- Type the objects out rather than pasting them. The test checks the values; the
  point is being able to justify them.

## Done when

```bash
npm run check 15/03
```

<details>
<summary>Hint 1 — why <code>types: []</code> and not just leaving it out</summary>

Left out, TypeScript loads **every** `@types/*` package it can find in
`node_modules` into global scope — including transitive ones you never
installed. `types: []` means "none automatically; I will import what I need".
For a Node package you want `["node"]`, which is why the library config differs.
</details>

<details>
<summary>Hint 2 — <code>moduleDetection: "force"</code></summary>

A `.ts` file with no top-level `import` or `export` is a *script*, and its
top-level `const` lands in global scope where it can collide with another file's.
`"force"` makes every file a module regardless. It costs nothing and removes a
class of confusing errors.
</details>

<details>
<summary>Hint 3 — the ownership rule</summary>

Ask whether the job needs to understand **types**. Type-checking and emitting
`.d.ts` files do; transpiling, tree-shaking and minifying do not. That is the
whole line, and it is why the bundler can be so much faster.
</details>

<details>
<summary>Hint 4 — <code>declarationMap</code></summary>

Without it, "go to definition" on your library's export lands in
`dist/index.d.ts`. With it, the editor follows the map back to the original
`.ts`. Cheap, and the first thing consumers of a monorepo package notice.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it
justifies every line of both configs, explains why `tsc --noEmit` still belongs
in CI when Vite is doing the compiling, and covers what `skipLibCheck` really
costs.

**That completes section 15.** Next:
[section 16 — third-party libraries & declaration files](../../16-libs-and-ts/).
