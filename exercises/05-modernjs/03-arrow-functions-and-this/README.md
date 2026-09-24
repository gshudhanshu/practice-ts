# 05/03 — Arrow functions, closures and `this`

**Tier:** Core · **Time:** ~25 min · **Course section:** 05 — Modern JavaScript

---

## Why this exercise exists

`this` is the part of JavaScript people most reliably get wrong, and one of the
few places TypeScript can genuinely help — but only if you tell it what `this`
is supposed to be.

Three situations cover almost every real case:

1. A method gets **detached** from its object (`onClick={this.handleClick}`).
2. A callback **inside** a method needs the outer `this`.
3. A standalone function is only valid with a particular `this`.

This exercise is one TODO for each, plus two closure problems that show you can
often avoid `this` entirely.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `makeCounter()` — closure-based, private state, independent instances. |
| 2 | `Timer.tick` keeps working when detached (`const fn = timer.tick; fn()`). |
| 3 | `Greeter.greetAll` uses `this.greeting` inside a `.map` callback. |
| 4 | `describePerson` declares a **`this` parameter** typed as `Person`. |
| 5 | `once(fn)` runs `fn` at most once and caches the result — including falsy ones. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- TODO 1 and 5 must use closures — no classes, no module-level state.
- Do not use `.bind()` in TODO 2. There is a cleaner way.

## Done when

```bash
npm run check 05/03
```

<details>
<summary>Hint 1 — why a detached method breaks</summary>

`this` in a normal function is decided by **how it is called**, not where it was
written. `timer.tick()` sets `this` to `timer`; `fn()` sets it to `undefined`
(module code is strict mode). So `this.#ticks` throws.

Arrow functions have no `this` of their own — they capture the one in scope
where they were **created**. Which means an arrow stored as a class *field*
captures the instance permanently.
</details>

<details>
<summary>Hint 2 — TODO 3</summary>

Same idea from the other direction: inside `greetAll`, `this` is correct. You
need the `.map` callback to inherit it rather than establish its own.
</details>

<details>
<summary>Hint 3 — the `this` parameter</summary>

TypeScript lets you declare a fake first parameter called exactly `this`:

```ts
function f(this: SomeType, real: string) { … }
```

It must come first, it is not a real argument (callers never pass it), and it is
erased at compile time. Now `f()` is an error and `f.call(obj)` is checked.
</details>

<details>
<summary>Hint 4 — TODO 5 and falsy results</summary>

`if (!result) result = fn();` re-runs `fn` forever when it returns `0`. Track
"have I run yet?" **separately** from the value — either a boolean flag or by
storing the result in an object that starts as `undefined`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the four `this` binding rules, arrow-property vs `bind` (they have different
costs), and why closures are usually the simpler answer.
