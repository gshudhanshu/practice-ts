/**
 * Exercise 13/03 — Observable model (decorators project, part 3 of 3) —
 * CHALLENGE
 *
 * The headline feature of standard decorators is the `accessor` keyword:
 *
 *   accessor theme = "light";
 *
 * That is not a field. It compiles to a private backing field plus a getter and
 * a setter, and an ACCESSOR DECORATOR can replace either half:
 *
 *   (target, context) => ({ get?, set?, init? })
 *
 * `target` is `{ get, set }` — the pair you are wrapping. `init` transforms the
 * starting value. Because you can intercept the setter, you can do the thing a
 * field decorator cannot: notice that a value changed.
 *
 * That is the whole of MobX, Lit's `@property`, and Angular signals-adjacent
 * reactivity in one idea. You are building a small version of it.
 *
 * As in 13/01 and 13/02, decorators run at class-definition time, so the
 * decorator starters are no-ops rather than `throw`s.
 *
 * Read README.md first. Replace every TODO.
 */

export type Change = {
  property: string;
  from: unknown;
  to: unknown;
};

export type Listener = (changes: readonly Change[]) => void;

/** An accessor decorator that may only be applied to an accessor of `Value`. */
export type AccessorDecorator<Value> = <This extends object>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
) => ClassAccessorDecoratorResult<This, Value>;

/* ── Given: per-model state and the notification plumbing ─────────────────── */

type ModelState = {
  listeners: Set<Listener>;
  /** Observable properties, in declaration order, each with a reader. */
  observed: { property: string; read: () => unknown }[];
  /** How many `batch` calls are currently open. */
  depth: number;
  /** Changes recorded while a batch is open. */
  pending: Change[];
};

const STATE = new WeakMap<object, ModelState>();

export function stateOf(model: object): ModelState {
  const existing = STATE.get(model);
  if (existing !== undefined) return existing;

  const fresh: ModelState = {
    listeners: new Set(),
    observed: [],
    depth: 0,
    pending: [],
  };
  STATE.set(model, fresh);
  return fresh;
}

/** Send one notification to every current listener. */
export function notify(model: object, changes: readonly Change[]): void {
  if (changes.length === 0) return;
  // Iterate a copy: a listener is allowed to unsubscribe itself while running.
  for (const listener of [...stateOf(model).listeners]) {
    listener(changes);
  }
}

/** Route one change: into the open batch, or straight out to the listeners. */
export function recordChange(model: object, change: Change): void {
  const state = stateOf(model);
  if (state.depth > 0) {
    state.pending.push(change);
    return;
  }
  notify(model, [change]);
}

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// `@observable` — wrap the accessor so a real change is announced.
//
//   const s = new Settings();
//   subscribe(s, (changes) => log.push(changes));
//   s.theme = "dark";    // one change: { property: "theme", from: "light", to: "dark" }
//   s.theme = "dark";    // nothing — the value did not change
//
// Two things the naive version gets wrong:
//
//   * Compare with `Object.is`, not `===`, so `NaN` and `-0` behave.
//   * Report the value that was actually STORED, not the value passed in.
//     Another decorator underneath you (see TODO 4) may have changed it, so
//     write first and then read back through `target.get`.
//
// Also register the property with `stateOf(this).observed` from an initializer,
// so TODO 3 can list them in declaration order. Push
// `{ property, read: () => target.get.call(this) }`.
export function observable<This extends object, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  // TODO 1 — replace this no-op.
  void context;
  return target;
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Register a listener and hand back the way to remove it.
//
//   const off = subscribe(settings, listener);
//   off();     // stops it
//   off();     // calling twice is harmless
export function subscribe(model: object, listener: Listener): () => void {
  throw new Error("TODO 2: implement subscribe");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A plain-object copy of every OBSERVABLE property, in declaration order.
//
//   snapshot(new Settings())
//   // { theme: "light", fontSize: 14, volume: 50 }
//
// Undecorated accessors and ordinary fields must not appear. Each call returns
// a fresh object.
export function snapshot(model: object): Record<string, unknown> {
  throw new Error("TODO 3: implement snapshot");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// `@clamp(min, max)` — an accessor decorator that keeps a number in range, both
// when it is set AND when it is first initialised.
//
//   settings.volume = 150;   // stores 100
//   settings.volume = -20;   // stores 0
//
// Stack it UNDER `@observable` and the change that gets announced must carry
// the clamped value — which is what "read back after writing" in TODO 1 buys
// you. Use the `init` half of the result for the starting value.
export function clamp(min: number, max: number): AccessorDecorator<number> {
  return function <This extends object>(
    target: ClassAccessorDecoratorTarget<This, number>,
    _context: ClassAccessorDecoratorContext<This, number>,
  ): ClassAccessorDecoratorResult<This, number> {
    // TODO 4 — replace this no-op.
    void min;
    void max;
    return target;
  };
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Coalesce a burst of writes into ONE notification.
//
//   batch(settings, () => {
//     settings.theme = "dark";
//     settings.fontSize = 16;
//     settings.fontSize = 18;
//   });
//   // listeners are called ONCE, with:
//   //   [{ property: "theme",    from: "light", to: "dark" },
//   //    { property: "fontSize", from: 14,      to: 18 }]
//
// The rules:
//   * one entry per property, in the order that property FIRST changed;
//   * `from` is the earliest recorded value, `to` the latest;
//   * a property that ends where it started is dropped entirely;
//   * if nothing survives, no notification at all;
//   * nested batches: only the outermost one flushes;
//   * `fn` throwing must not leave the batch open — and the changes made
//     before it threw are still announced;
//   * `batch` returns whatever `fn` returned.
//
// `stateOf(model).depth` and `.pending` are there for you.
export function batch<T>(model: object, fn: () => T): T {
  throw new Error("TODO 5: implement batch");
}

// ─── Wiring ──────────────────────────────────────────────────────────────────
// Nothing below needs editing.

export class Settings {
  @observable
  accessor theme = "light";

  @observable
  accessor fontSize = 14;

  @observable
  @clamp(0, 100)
  accessor volume = 50;

  /** Deliberately NOT observable — snapshot must skip it. */
  accessor sessionId = "s-1";

  /** A plain field, for the same reason. */
  createdAt = "2026-01-01";
}

/** Starts out of range on purpose: `init` has to fix it before anyone reads. */
export class ImportedSettings {
  @observable
  @clamp(0, 100)
  accessor volume = 500;
}
