# 13/03 — Observable model

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 13 — Decorators practice

---

## Where this fits

Part 3 of the section-13 project, and the one that combines it. 13/01 decorated
methods, 13/02 decorated fields; this one decorates **auto-accessors**, which is
the piece that makes reactivity possible.

```ts
@observable
accessor theme = "light";
```

`accessor` is not a field. It compiles to a private backing field plus a getter
and a setter, and an accessor decorator can replace either half:

```ts
(target, context) => ({ get?, set?, init? })
```

Because you can intercept the setter, you can notice that a value **changed** —
which a field decorator cannot do at all. That single capability is what MobX,
Lit's `@property` and every "observable model" library are built on.

## Your task

Open `exercise.ts` and resolve all five TODOs. `Settings` at the bottom is
already wired up; the decorators and the three functions are yours.

| # | Requirement |
|---|---|
| 1 | `observable` — announce a real change; register the property for TODO 3. |
| 2 | `subscribe(model, listener)` — returns an idempotent unsubscribe. |
| 3 | `snapshot(model)` — observable properties only, in declaration order. |
| 4 | `clamp(min, max)` — clamps on **set** and on **init**; stacks under `@observable`. |
| 5 | `batch(model, fn)` — coalesce a burst of writes into one notification. |

### What `batch` must do

```ts
batch(settings, () => {
  settings.theme = "dark";
  settings.fontSize = 16;
  settings.fontSize = 18;
});
// ONE call, with:
// [{ property: "theme",    from: "light", to: "dark" },
//  { property: "fontSize", from: 14,      to: 18 }]
```

- one entry per property, ordered by when that property **first** changed;
- earliest `from`, latest `to`;
- a property that ends where it started is dropped;
- nothing survives ⇒ no notification at all;
- nested batches: only the outermost flushes;
- `fn` throwing must still flush and must still close the batch;
- `batch` returns whatever `fn` returned.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do not set `experimentalDecorators`.
- `stateOf`, `notify` and `recordChange` are given. Use them.
- `snapshot` must not index the model by property name — that would need a cast.

## Done when

```bash
npm run check 13/03
```

<details>
<summary>Hint 1 — the shape of an accessor decorator</summary>

`target` is the `{ get, set }` pair you are wrapping, and both are ordinary
functions that need a `this`:

```ts
return {
  get(this: This): Value {
    return target.get.call(this);
  },
  set(this: This, value: Value): void {
    …
  },
};
```

Return only the halves you want to replace. Anything you omit keeps the
behaviour underneath.
</details>

<details>
<summary>Hint 2 — write, then read back</summary>

The obvious setter compares `from` with the incoming `value`. That is wrong as
soon as a second decorator sits underneath, because what gets **stored** may not
be what was passed in:

```ts
const from = target.get.call(this);
target.set.call(this, value);
const to = target.get.call(this);      // what the model actually holds now
if (Object.is(from, to)) return;
```

This also gets the "clamping landed on the current value" case right for free —
two tests cover exactly that.
</details>

<details>
<summary>Hint 3 — snapshot without indexing the object</summary>

`model[property]` needs a cast, because `model` is an `object`. Store the reader
instead of the name alone, at registration time, while you still have
`target.get` in scope:

```ts
stateOf(this).observed.push({
  property,
  read: () => target.get.call(this),
});
```

Then `snapshot` just walks that list. Declaration order comes free: initialisers
run in field order.
</details>

<details>
<summary>Hint 4 — `init` is not the same as `set`</summary>

A field initialiser (`accessor volume = 500`) is not an assignment, so your
`set` never sees it. That is what `init` is for:

```ts
init(this: This, value: number): number {
  return limit(value);
}
```

It runs once per instance, transforming the starting value before anyone can
read it.
</details>

<details>
<summary>Hint 5 — the batch skeleton</summary>

```ts
const state = stateOf(model);
state.depth += 1;
try {
  return fn();
} finally {
  state.depth -= 1;
  if (state.depth === 0) { … flush … }
}
```

`try`/`finally` is what makes the throwing case work — and returning from inside
`try` still runs the `finally` before the value leaves.

For the merge, a `Map<string, Change>` keyed by property does all three jobs at
once: it dedupes, it preserves first-seen order, and updating `to` on a hit
keeps the earliest `from`. Then filter out the ones where `from` and `to` match.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md), then the
[section summary](../README.md).
