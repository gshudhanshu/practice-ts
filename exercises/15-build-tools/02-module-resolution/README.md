# 15/02 — module resolution

**Tier:** Core · **Time:** ~30 min · **Course section:** 15 — Build tools & Vite

---

## Why this exercise exists

*"Cannot find module './util' or its corresponding type declarations."*

Every TypeScript developer has lost an afternoon to that message, and the cause
is always the same: **`moduleResolution` decides how a specifier becomes a
file**, and the three modes in use today disagree about almost everything.

Worse, the failure is often asymmetric — `tsc` is happy and Node is not, or the
bundler is happy and `tsc` is not. Knowing which mode you are in, and what it
implies, is the whole skill.

Throughout, assume the package is ESM (`"type": "module"` in `package.json`).

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `relativeSpecifier` — the specifier to write for a sibling file |
| 2 | `supports` — the 3 × 4 capability matrix |
| 3 | `diagnose` — symptom → cause |
| 4 | `resolveExports` — the `package.json` `exports` algorithm |
| 5 | `modeFor` — which mode for which build |

### TODO 2 — the matrix

| | `bundler` | `node10` | `nodenext` |
|---|---|---|---|
| extensionless relative imports | ✅ | ✅ | ❌ |
| directory index (`./models` → `./models/index.ts`) | ✅ | ✅ | ❌ |
| `package.json` `exports` | ✅ | ❌ | ✅ |
| `package.json` `imports` (`#internal/db`) | ✅ | ❌ | ✅ |

### TODO 3 — the mapping

| Symptom | Meaning |
|---|---|
| `tsc-cannot-find-a-sibling-module` | `import "./util"` in a `nodenext` project |
| `node-cannot-find-a-module-that-tsc-resolved-happily` | Compiles, then `ERR_MODULE_NOT_FOUND` at run time |
| `a-deep-import-into-a-dependency-fails-although-the-file-is-there` | `import "pkg/lib/util"`, and `node_modules/pkg/lib/util.js` exists |
| `a-package-ships-types-but-tsc-says-it-has-no-declarations` | The `.d.ts` is in the tarball, and TypeScript never finds it |
| `a-default-import-of-a-commonjs-package-is-undefined-at-runtime` | `import pkg from "cjs-pkg"` gives `undefined` |

### TODO 4 — the algorithm, exactly

1. An **exact** subpath key wins.
2. Otherwise the `*` pattern whose prefix *and* suffix match. If several match,
   the one with the **longest prefix** wins. The matched text is substituted for
   the `*` in the target.
3. A `null` target means **deliberately blocked** → `null`.
4. Inside a conditions object, keys are tried in **declaration order**.
   `"default"` always matches. First match wins.
5. Nothing matched → `null`.

Rule 4 is not a detail. A map that lists `"import"` before `"types"` hands
TypeScript the `.mjs` file, and you get "has no exported member" from a package
that definitely ships declarations. The test pins that behaviour.

Every pattern in this exercise contains at most one `*`.

## Rules

- Do not edit `exercise.test.ts`.
- `resolveExports` must be pure — no `any`, no `as`, no `!`.
- `noUncheckedIndexedAccess` is on: `map[subpath]` is `ExportsEntry | undefined`,
  and `undefined` ("not listed") is a different answer from `null`
  ("listed, and blocked").

## Done when

```bash
npm run check 15/02
```

<details>
<summary>Hint 1 — why nodenext wants an extension that does not exist</summary>

Node resolves the specifier **at run time**, against the JavaScript on disk.
`./util.ts` will have become `./util.js` by then, so `./util.js` is the honest
thing to write in the source. TypeScript understands the mapping and looks for
`util.ts` when you write `util.js`.

It reads as a bug the first ten times. It is the only design that works without
a resolver in the runtime.
</details>

<details>
<summary>Hint 2 — a nested Record for the matrix</summary>

`Record<ResolutionMode, Record<Feature, boolean>>` makes the compiler check both
dimensions: add a mode or a feature and the literal stops compiling until every
cell exists. Then `matrix[mode][feature]` is a single expression. Same trick as
03/04, one level deeper.
</details>

<details>
<summary>Hint 3 — order of business in <code>resolveExports</code></summary>

Two phases. First pick the subpath (exact, then best pattern), keeping the text
the `*` matched. Then resolve the target you found, passing that text down so
the recursion can substitute it. A helper function for phase two keeps both
halves readable, and the recursion falls out naturally because a condition's
value can be another conditions object.
</details>

<details>
<summary>Hint 4 — matching a pattern</summary>

Split the key on its `*` into `prefix` and `suffix`. The subpath matches when it
starts with `prefix`, ends with `suffix`, and is long enough to contain both.
The wildcard text is everything in between:
`subpath.slice(prefix.length, subpath.length - suffix.length)`.
</details>

<details>
<summary>Hint 5 — declaration order really is the priority order</summary>

`Object.entries` preserves insertion order for string keys, so iterating it *is*
the specified condition order. Do not sort it, and do not look the caller's
conditions up in the object — the direction of the loop is the whole point.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `exports` broke deep imports on purpose, the `"types"`-first rule, what
`node16`/`node10` mean next to `nodenext`, and the dual-package hazard.

Next: [15/03 — configure for a bundler](../03-configure-for-a-bundler/).
