# 02/06 — CHALLENGE: `unknown`, type guards, exhaustiveness

**Tier:** Challenge · **Time:** ~35 min · **Course section:** 02 — Essentials

---

## Scenario

You are at the boundary where data enters your program — a JSON response, a
webhook body, a message off a queue. Inside that boundary you want real types.
Outside it you have *nothing*, and pretending otherwise is where most production
TypeScript bugs are born.

This exercise is the section-02 boss fight. It combines everything from 02/01–05
and adds the three tools that separate people who "use TypeScript" from people
who can be trusted with a codebase: `unknown`, type predicates, and `never`.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `safeJsonParse` returns **`unknown`** (never `any`), or `undefined` on invalid JSON. |
| 2 | `isRecord` is a type predicate for a plain object. `null` and arrays must **not** pass. |
| 3 | `parseUser` validates untrusted input into a `User` or returns `null`. Extra properties are dropped; an absent `age` must leave the key genuinely absent. |
| 4 | `assertNever` takes `never` and returns `never`. |
| 5 | `describeEvent` handles every case with a `switch` and calls `assertNever` in `default`. |

## Rules

- Do not edit `exercise.test.ts`.
- **No `any` anywhere.** That is the whole point of this exercise.
- No `as` except where genuinely unavoidable, and no `!`.

## Done when

```bash
npm run check 02/06
```

<details>
<summary>Hint 1 — why not just use <code>any</code> from JSON.parse?</summary>

`any` disables checking for everything it touches, and it spreads: assign it to
a variable, pass it to a function, and that value is now unchecked too.
`unknown` is the safe counterpart — you can hold it, but you must **prove** what
it is before you use it. Containing `any` at the one line where it enters the
program is the whole technique.
</details>

<details>
<summary>Hint 2 — isRecord has two traps</summary>

`typeof null === "object"` and `typeof [] === "object"`. You need three
conditions, and the return type must be `value is Record<string, unknown>` —
not `boolean`, or nothing downstream narrows.
</details>

<details>
<summary>Hint 3 — parseUser and <code>exactOptionalPropertyTypes</code></summary>

You cannot write `{ id, name, email, age }` when `age` is `undefined` — that
flag makes an explicit `undefined` different from an absent key.

Build the base object first, then attach `age` only when you have proven it is
a number:

```ts
const user: User = { id, name, email };
if (typeof age === "number") user.age = age;
```
</details>

<details>
<summary>Hint 4 — how the exhaustiveness check works</summary>

Inside `default:`, TypeScript has eliminated every handled case, so the variable
narrows to `never`. Passing it to a function whose parameter is `never` therefore
compiles — but **only while every case is handled**. Miss one and the leftover
member is not assignable to `never`, and the line fails.

Try it: comment out the `scroll` case and read the error.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md). It covers
`unknown` vs `any` vs `never`, why hand-written validators lose to schema
libraries at scale, and a genuinely surprising `ReturnType<>` bug involving
`never` parameters that you can use to sound very well-read.
