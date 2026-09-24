# 08/05 — A typed event emitter

## The whole trick, in two lines

```ts
on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): Unsubscribe
emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void
```

`K` captures **which** event name was passed, and `TEvents[K]` looks up that
event's payload type. Every guarantee follows from those two pieces:

- `"nope"` is not in `keyof TEvents` → unknown event names fail.
- The callback's parameter is `TEvents["login"]` → `payload.reason` fails.
- `emit`'s second argument is `TEvents["login"]` → wrong payloads fail.

This is `pluck` from 08/02, applied twice. If you can write `pluck`, you can
write this — which is exactly why interviewers like the question.

## Why `Listener<never>` for the store

The store is **heterogeneous**: one map holds `Listener<{userId: string}>` and
`Listener<{message: string; code: number}>` under different keys. No single
element type describes that.

`Listener<never>` accepts them all on the way in, because function parameters
are **contravariant**:

> `(a: A) => void` is assignable to `(b: B) => void` when **B is assignable to A**
> — the direction is reversed.

`never` is assignable to every type, so every `Listener<X>` is assignable to
`Listener<never>`. It is the "widest" listener to store, and correspondingly the
one you cannot call: calling it would need an argument of type `never`, and no
value has that type.

Hence the single cast in `emit`. It is sound by construction — `on` only ever
stores a `Listener<TEvents[K]>` under key `K` — but the compiler cannot see that
invariant across two methods.

> Under `strictFunctionTypes` (part of `strict`) this contravariance is enforced
> for function *type* positions. Methods declared with method syntax are still
> checked bivariantly for legacy reasons, which is a good bit of trivia.

Node's `EventEmitter`, `mitt` and `EventEmitter3` all use `any` internally here.
The lesson is containment: unsafety on one line, behind a fully typed API.

## Iterate a copy in `emit`

```ts
for (const listener of [...set]) { … }
```

`once` removes its own listener *during* the emit, and mutating a `Set` while
iterating it is undefined-ish behaviour (JavaScript's Set iterator does visit
entries added during iteration, which can loop forever). The snapshot also
defines a clear semantic: **an emit calls the listeners registered when it
started**, so a handler that adds a new listener does not trigger it for the
current event.

That is the same choice Node's EventEmitter makes, and it is worth stating
explicitly rather than leaving to chance.

## `once`, and why it removes itself first

```ts
const wrapper: Listener<TEvents[K]> = (payload) => {
  this.off(event, wrapper);   // FIRST
  listener(payload);          // then
};
return this.on(event, wrapper);
```

Removing first means a listener that re-emits the same event cannot re-enter
itself — an infinite loop that is very annoying to debug.

Delegating to `on` gives three things for free: registration, the unsubscribe
return (so `once` can be cancelled before it ever fires), and any future change
to how listeners are stored.

Note the wrapper is a **new function object**, so `off(event, originalListener)`
will not remove a `once` registration. Real emitters keep a wrapper→original
map to support that; here the returned unsubscribe covers it.

## A `Set`, and cleaning up empties

A `Set` gives de-duplication (registering the same function twice registers it
once — one test checks this), insertion order, and O(1) delete.

```ts
if (set.size === 0) this.#listeners.delete(event);
```

Without this, an emitter that sees many event names accumulates empty Sets
forever. A small leak, but a real one in long-lived processes.

## Where this pattern generalises

The same `K extends keyof TMap` shape powers:

- **Typed RPC / message buses** — `send<K>(method: K, params: TApi[K]["params"]): TApi[K]["result"]`
- **Redux-style action dispatch** — `dispatch<K>(type: K, payload: TActions[K])`
- **`addEventListener`** — the DOM's own `HTMLElementEventMap` is exactly this
- **Typed feature flags / config getters** — `get<K extends keyof TConfig>(key: K): TConfig[K]`

Recognising it once means recognising it everywhere.

## Common mistakes

| Mistake | What happens |
|---|---|
| `event: keyof TEvents` without capturing `K` | Payload becomes the union of all payloads |
| `Listener<any>` in the store | Works, but throws away checking — and `any` is banned |
| Iterating the Set directly in `emit` | The unsubscribe-during-emit test fails or loops |
| `once` calling the listener before removing | Re-entrancy: a re-emitting listener loops |
| An array instead of a Set | The duplicate-registration test fails |
| Not deleting empty Sets | `listenerCount` still works, but memory grows |
| `off` before checking the Set exists | Throws on an event that never had listeners |

## Interview angle

> *"Design a type-safe event emitter."*

Lead with the signature — `on<K extends keyof TEvents>(event: K, listener: (payload: TEvents[K]) => void)` — because that single line is the answer. Then
cover the runtime details that separate a working emitter from a sketch:
iterate a copy so listeners can unsubscribe mid-emit, remove before calling in
`once`, return an unsubscribe rather than making callers remember the function
reference.

> *"Can you write it with no `any` at all?"*

Not in the store, and being able to say **why** is the strong answer: the store
is heterogeneous, `Listener<never>` accepts everything by contravariance but
cannot be called, so one cast is needed. Then the principle — contain it on one
line behind a typed API, which is exactly what every real emitter does.
