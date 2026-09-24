# 08/05 — CHALLENGE: a typed event emitter

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 08 — Generics

---

## Why this exercise exists

This is *the* classic generics interview question, and it is genuinely useful
code. One class, parameterised by a map of event name → payload type, where:

- an unknown event name is a **compile error**
- the listener's payload type **follows** the event name
- emitting the wrong payload is a **compile error**

Given:

```ts
type AppEvents = {
  login: { userId: string };
  logout: { userId: string; reason: string };
  error: { message: string; code: number };
};
```

…this must hold:

```ts
emitter.on("login", (payload) => payload.userId);   // payload is { userId: string }
emitter.on("login", (payload) => payload.reason);   // compile error
emitter.emit("login", { wrong: true });             // compile error
```

`K extends keyof TEvents` plus `TEvents[K]` — from 08/02 — does all of it.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Choose the internal storage — one set of listeners per event name. |
| 2 | `on(event, listener)` — typed payload, returns an unsubscribe function. |
| 3 | `off(event, listener)` — removes one listener; unknown listener is a no-op. |
| 4 | `emit(event, payload)` — registration order; safe if a listener unsubscribes mid-emit. |
| 5 | `once(...)` — fires at most once, then removes itself. Plus `listenerCount`. |

Also required by the tests: registering the **same function twice** for one
event must only register it once.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `!`.
- **One `as` is permitted**, inside `emit`, and you will need it. See below.

## Why one cast is unavoidable

The store holds listeners for events with *different* payload types, so no
single element type describes it. `Listener<never>` accepts them all going in
(parameters are contravariant, and `never` is assignable to everything) but
cannot be **called**.

Real emitters — Node's, EventEmitter3, mitt — all use `any` internally for the
same reason. The lesson is not "casts are fine", it is **contain the unsafety at
one line, behind a fully typed public API** — the same move as `safeJsonParse`
in 02/06.

## Done when

```bash
npm run check 08/05
```

<details>
<summary>Hint 1 — storage</summary>

```ts
#listeners = new Map<keyof TEvents, Set<Listener<never>>>();
```

A `Set` per event gives you de-duplication (one test relies on it), insertion
order, and an O(1) `delete`.
</details>

<details>
<summary>Hint 2 — emit must iterate a copy</summary>

`once` removes its listener *during* the emit. Mutating a `Set` while iterating
it is a bug, so snapshot first:

```ts
for (const listener of [...set]) { … }
```

One test registers a listener that unsubscribes itself and checks that the
*next* listener still runs.
</details>

<details>
<summary>Hint 3 — `once` without duplicating logic</summary>

Build a wrapper that removes itself and then calls the real listener, and
register it with `on`. Returning `this.on(event, wrapper)` gives you the
cancel-before-it-fires behaviour for free.

Remove **before** calling the listener, so a listener that re-emits the same
event cannot re-enter itself.
</details>

<details>
<summary>Hint 4 — keeping `listenerCount` honest</summary>

When a Set becomes empty, delete the map entry as well. Otherwise empty Sets
accumulate — a slow memory leak in a long-lived emitter.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `Listener<never>` is the right store type, function parameter contravariance,
and how this pattern generalises to typed RPC and message buses.

**That completes section 08.** Next: [section 09 — classes & generics practice](../../09-classes-generics-practice/).
