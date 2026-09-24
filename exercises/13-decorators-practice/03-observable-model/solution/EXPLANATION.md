# 13/03 — Observable model

## What `accessor` actually compiles to

```ts
accessor theme = "light";
```

becomes, roughly:

```js
#theme = "light";
get theme() { return this.#theme; }
set theme(v) { this.#theme = v; }
```

Three consequences worth holding on to:

- **The storage is private.** Nothing outside the class can reach `#theme`, so
  the only way in or out is through the pair — which is what makes interception
  reliable rather than best-effort.
- **It is a property, not a field.** `Object.hasOwn(settings, "theme")` is
  `false`; the accessors live on the prototype.
- **The initialiser is not an assignment.** `= "light"` sets the backing field
  directly, so your `set` never sees it. That is what `init` exists for.

The decorator receives `target: { get, set }` and returns
`{ get?, set?, init? }`. Omit a half and the underlying one stays.

## Write, then read back

The tempting setter:

```ts
// WRONG
set(this: This, value: Value): void {
  const from = target.get.call(this);
  if (Object.is(from, value)) return;
  target.set.call(this, value);
  recordChange(this, { property, from, to: value });
}
```

It passes every test until a second decorator appears underneath. With
`@clamp(0, 100)` below, `settings.volume = 150` stores `100` but announces
`to: 150` — the listeners are now told something that is not true of the model.

```ts
target.set.call(this, value);
const to = target.get.call(this);
if (Object.is(from, to)) return;
```

Writing first and reading back describes what the model *holds*, not what the
caller *asked for*. It also fixes a second case for free: setting `200` when the
value is already clamped at `100` now correctly announces nothing.

The cost is that you always write, even for a no-op assignment. For a setter
with side effects further down that would matter, and then you would need a
different design. For value storage it does not.

## `Object.is`, not `===`

```ts
if (Object.is(from, to)) return;
```

Two differences, both real:

- `NaN === NaN` is `false`, so `===` reports a change every time a `NaN` is
  written over a `NaN`. In a reactive graph that is an infinite loop waiting to
  happen.
- `0 === -0` is `true`, so `===` misses a genuine change. Rare, but free to get
  right.

`Object.is` is the SameValue algorithm, which is the one you want for
change detection. React uses it for the same reason.

## Why `snapshot` stores a reader, not a name

`model` is an `object`, so `model[property]` does not typecheck, and the usual
escape is `(model as Record<string, unknown>)[property]` — a cast that is also
wrong for `#private` storage.

The registration already has everything needed:

```ts
stateOf(this).observed.push({
  property,
  read: () => target.get.call(this),
});
```

`target.get` is in scope in the decorator, and `this` is in scope in the
initialiser. Closing over both gives a typed reader with no assertion anywhere,
and declaration order comes free because initialisers run in field order.

## Batching

```ts
state.depth += 1;
try {
  return fn();
} finally {
  state.depth -= 1;
  if (state.depth === 0) { … }
}
```

Four separate decisions live in that skeleton.

**A depth counter, not a boolean.** Nested batches are normal — one batched
operation calls another — and a boolean would make the inner one flush,
splitting the outer notification in two.

**`try`/`finally`, not sequential statements.** If `fn` throws, the depth must
still come back down; otherwise the model is permanently silent and the bug
surfaces somewhere unrelated. `return fn()` inside `try` still runs `finally`
before the value leaves.

**Flush on the way out even when `fn` threw.** The writes that happened before
the throw really did happen. Suppressing them would leave listeners describing a
model that no longer exists. (Rolling *back* would be a different, much larger
feature — you would need the original values and a way to restore them without
re-notifying.)

**Take the queue before notifying.**

```ts
const pending = state.pending;
state.pending = [];
```

A listener is allowed to write to the model, and `depth` is already `0` by then,
so those writes notify immediately. If the queue were cleared *after*
notification, they would be swallowed.

## The merge, in one data structure

```ts
const merged = new Map<string, Change>();
for (const change of pending) {
  const seen = merged.get(change.property);
  if (seen === undefined) merged.set(change.property, { ...change });
  else seen.to = change.to;
}
```

A `Map` keyed by property does three jobs at once: it dedupes, it preserves
first-insertion order (which is exactly "the order that property first
changed"), and only ever updating `to` on a hit means `from` keeps the earliest
value automatically.

`{ ...change }` matters — without the copy you would mutate the queued object,
which the caller may still be holding.

Then:

```ts
[...merged.values()].filter((c) => !Object.is(c.from, c.to))
```

`theme: "light" → "dark" → "light"` is not a change anyone should hear about.
Dropping it is the difference between a change *log* and a change *diff*, and a
diff is what a UI wants.

## Decorator composition order, again

```ts
@observable
@clamp(0, 100)
accessor volume = 50;
```

Bottom-up: `clamp` wraps the raw accessor, then `observable` wraps clamp's
result. So a write goes `observable.set` → `clamp.set` → backing field, and the
read-back goes the other way. Swap them and `observable` sits underneath, so it
announces the raw value and the clamp happens above it — the model would hold
`100` while the listeners were told `150`.

`init` composes too, innermost first, which is why `ImportedSettings` starts at
`100` rather than `500`.

## Common mistakes

| Mistake | What happens |
|---|---|
| Comparing `from` with the incoming `value` | Announces the pre-clamp value; two tests catch it |
| `===` instead of `Object.is` | Repeated `NaN` writes look like changes |
| Arrow functions in the returned `get`/`set` | `this` is the decorator body's, not the instance's |
| Forgetting `init` | An out-of-range initialiser survives until the first assignment |
| `(model as Record<string, unknown>)[property]` in `snapshot` | Banned cast, and it cannot read the backing field |
| A boolean `batching` flag | A nested batch flushes early and splits the notification |
| Flushing outside `finally` | A throwing callback leaves the model silent forever |
| Clearing `pending` after notifying | Writes made by a listener are swallowed |
| Reusing the queued `Change` object in the merge | Mutates an object the caller may still hold |
| Notifying with an empty change list | Listeners are woken for nothing |

## Interview angle

> *"How would you implement a small observable/reactive model?"*

Intercept the setter — with standard decorators that means an `accessor`
decorator returning a replacement `set`. Compare with `Object.is` so no-op
writes are silent, and describe the *stored* value rather than the incoming one,
because another layer may have transformed it. Then the part that separates a
toy from something usable: batching, so a burst of writes produces one
notification, with a merge that keeps the earliest `from`, the latest `to`, and
drops properties that came back to where they started.

> *"Why `accessor` rather than a plain field?"*

Because a field decorator cannot observe writes. It gets one shot at the initial
value and is never consulted again — there is nothing to intercept, since a
field is just a slot. `accessor` generates a getter/setter pair over private
storage, which gives the decorator both halves and guarantees nobody can bypass
them. That is the reason the auto-accessor was added to the decorators proposal
at all.
