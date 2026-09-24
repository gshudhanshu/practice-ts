# 16/02 — augmenting library types

**Tier:** Core · **Time:** ~25 min · **Course section:** 16 — Third-party libraries

---

## Why this exercise exists

Middleware attaches things to objects it does not own. A request logger wants
`req.context.requestId` — and `IncomingMessage` came from `@types/node`, which
you are not going to edit.

**Module augmentation** is the answer: re-open an interface a dependency
declared, and add to it. Interfaces are *open* by design — two declarations of
the same name merge into one, wherever in the program they live.

The interesting half is the cost. The addition is visible to your **whole
program**: every file now believes `req.context` might be there, including code
that runs long before your middleware. That is why the property is optional and
why reading it takes two helpers. Knowing when *not* to augment is the actual
skill, and TODO 5 is about exactly that.

We augment `node:http` here because it is installed and real. Express's
`Request` extends `IncomingMessage`, and [19/02](../../19-node-ts/02-augmenting-request/)
applies the same technique to Express itself.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Augment `node:http` so `IncomingMessage` has `context?: RequestContext` |
| 2 | `attachContext` — read `x-request-id`, fall back to `"generated"` |
| 3 | `contextOf` (never throws) and `requireContext` (throws) |
| 4 | `canMerge` — which declaration kinds merge |
| 5 | `techniqueFor` — augmentation is not always the answer |

### TODO 2 — the header has three shapes

Node types a header as `string | string[] | undefined`: absent, present once, or
repeated. Only the middle one is a request id.

| Header | `requestId` |
|---|---|
| `"abc"` | `"abc"` |
| absent | `"generated"` |
| `["abc", "def"]` | `"generated"` |

### TODO 5 — the scenarios

| Scenario | Question it is really asking |
|---|---|
| `add-a-property-to-a-third-party-interface` | The default case |
| `add-a-property-to-window` | Global scope, not a module |
| `the-library-exports-a-type-alias-not-an-interface` | Merging is not available |
| `one-function-needs-an-extra-field-and-no-other-file-should-see-it` | Program-wide reach is too much |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `context` must be **optional**. Declaring it required would make every
  request in the program claim to have one, which is a lie in exactly the way
  16/01 warned about.
- This exercise's `tsconfig.json` sets `"types": ["node"]` so `node:http`
  resolves, and excludes `solution/` so the reference augmentation cannot leak
  into the file you are editing.

## Done when

```bash
npm run check 16/02
```

<details>
<summary>Hint 1 — the shape of an augmentation</summary>

```ts
import type { Something } from "some-module";

declare module "some-module" {
  interface Something {
    extra?: MyType;
  }
}
```

Two conditions. The file must already be a module (this one imports, so it is),
and the specifier must be one that resolves — the same string you would write in
an `import`. Get either wrong and you have written an *ambient declaration* for a
module that does not exist, which is 16/01's job, not this one.
</details>

<details>
<summary>Hint 2 — no <code>export</code> inside the block</summary>

Members declared inside `declare module` are already part of that module. Adding
`export` in front of the interface changes the meaning; leave it off.
</details>

<details>
<summary>Hint 3 — narrowing the header</summary>

`typeof header === "string"` narrows all three cases at once: it rejects
`undefined` and `string[]` together, and leaves you with the one shape that is
actually a request id.
</details>

<details>
<summary>Hint 4 — why <code>Pick</code> is in the test</summary>

`Pick<IncomingMessage, … | "context">` only compiles when `"context"` really is
a key of `IncomingMessage`. If you had declared your own separate interface and
called it `ContextualRequest`, the tests would still pass at runtime and this
line would not compile — which is the difference between augmenting the
library's type and inventing a lookalike.
</details>

<details>
<summary>Hint 5 — TODO 4, the two that do not merge</summary>

Interfaces and namespaces are open. A type alias is a single definition of a
name — declaring it twice is "Duplicate identifier", and there is no
`type X = X & { … }` trick either, because that is circular. Classes are closed
the same way (a class *can* merge with an interface or a namespace, but not with
another class).
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
which module specifier to target, why augmentation is program-wide and what to
do when that is wrong, and the `res.locals` alternative Express ships for
exactly this reason.

Next: [16/03 — typing callback APIs](../03-typing-callback-apis/).
