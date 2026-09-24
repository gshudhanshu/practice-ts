# 05/03 — Arrow functions, closures and `this`

## How `this` is decided

For a **normal** function, `this` depends entirely on the call site. Four rules,
in priority order:

| Call form | `this` is |
|---|---|
| `new Fn()` | the new instance |
| `fn.call(x)` / `fn.apply(x)` / `fn.bind(x)` | `x` |
| `obj.fn()` | `obj` |
| `fn()` | `undefined` in strict mode (modules are always strict) |

An **arrow** function has no `this` at all. It closes over the `this` of the
enclosing scope at the point it was *written*, and no call form can change it —
`.call`, `.apply` and `.bind` are all silently ignored for `this`.

That single difference explains both TODO 2 and TODO 3.

## The detached-method problem

```ts
const fn = timer.tick;
fn();   // `this` is undefined -> throws
```

This is the bug behind every `onClick={this.handleClick}` that ever threw
"Cannot read properties of undefined". The reference is extracted from the
object, so the `obj.fn()` rule never applies.

Three fixes:

```ts
tick = () => { this.#ticks += 1; };        // arrow field   <- used here
constructor() { this.tick = this.tick.bind(this); }   // bind in constructor
element.addEventListener("click", () => timer.tick()); // wrap at the call site
```

**Arrow field vs `bind`:** both create a new function object per instance, so
both cost memory per instance and both break `prototype`-based sharing. The
arrow field is more readable and cannot be forgotten. Its real downsides: the
method is an own property rather than on the prototype, so it is harder to spy
on in tests, and subclasses cannot `super.tick()` it.

For a class with many handlers, wrapping at the call site keeps methods on the
prototype and is often the better trade.

## Callbacks inside methods

```ts
names.map((name) => `${this.greeting}, ${name}`);        // works
names.map(function (name) { return this.greeting; });    // `this` is undefined
```

Before arrow functions existed, this was solved with `const self = this;` or
`.map(fn, this)` (many array methods take a `thisArg` second argument). Arrows
made all of that obsolete — this is the single biggest practical reason they
were added to the language.

## `this` parameters

```ts
export function describePerson(this: Person): string {
  return `${this.name} (${this.age})`;
}
```

A fake first parameter named exactly `this`. It must come first, callers never
pass it, and it is **completely erased** from the emitted JavaScript. What it
buys:

- `describePerson()` is now a compile error.
- `describePerson.call({ nope: true })` is a compile error (this checking of
  `.call` needs `strictBindCallApply`, which `strict` includes).
- Assigning it as a method on an object checks that the object fits `Person`.

You will see this in DOM handler types (`this: HTMLElement`) and in older
library typings. It is also how `noImplicitThis` — one of the eight `strict`
flags — becomes actionable: it flags functions whose `this` is implicitly `any`
so that you go and declare it.

## Closures beat `this` when you have the choice

`makeCounter` has no `this` anywhere:

```ts
let count = 0;
return { increment: () => { count += 1; }, value: () => count };
```

`count` lives in the closure. It cannot be detached, cannot be rebound, and is
genuinely unreachable from outside — stronger encapsulation than TypeScript's
`private`, which is only a compile-time check. (`#private` class fields are
genuinely private at runtime too, which is why `Timer` uses `#ticks`.)

The trade-off: closure-based objects allocate a fresh set of functions per
instance, where class methods live once on the prototype. For a handful of
objects it does not matter; for hundreds of thousands, it does.

## `once` and the falsy-result trap

```ts
let cached: { value: number } | undefined;
if (cached === undefined) cached = { value: fn() };
return cached.value;
```

The naive version fails:

```ts
let result: number | undefined;
if (result === undefined) result = fn();   // fn() returning 0 is fine…
                                            // …but fn() returning undefined re-runs forever
if (!result) result = fn();                 // re-runs forever for 0
```

Tracking *"has it run?"* separately from *"what did it return?"* is the general
fix — a boolean flag works equally well. The test pins `0` for exactly this
reason.

## Common mistakes

| Mistake | What happens |
|---|---|
| `tick()` as a normal method | Detached test throws — `this` is undefined |
| `.bind(this)` in TODO 2 | Works, but the rules ask for the arrow field |
| `function (name) { … }` in `.map` | `this.greeting` throws |
| `describePerson(person: Person)` | A real parameter, not a `this` parameter — the `@ts-expect-error` lines fail |
| `if (!result)` in `once` | `fn` re-runs whenever it returns `0` |
| Returning `{ increment, value, count }` from `makeCounter` | The "does not expose state" test fails |

## Interview angle

> *"Why does `this` break when I pass a method as a callback?"*

Because `this` is determined by the call site, and extracting the reference
discards the receiver. Then name the fixes and their trade-offs: arrow class
field (per-instance allocation, not on the prototype, harder to spy on),
`.bind` in the constructor (same cost, easy to forget), or wrap at the call
site (cheapest, most explicit).

> *"What's the difference between an arrow function and a normal function?"*

The full answer is more than `this`: arrows have no own `this`, no `arguments`,
no `prototype`, cannot be used with `new`, and cannot be generators. `this`
being lexical is the one that matters day to day, but listing the others shows
you know it is a different kind of function object, not just shorter syntax.
