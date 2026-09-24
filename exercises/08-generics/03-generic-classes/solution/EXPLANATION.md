# 08/03 — Generic classes & interfaces

## Where the type parameter belongs

```ts
class Stack<T> {          // on the CLASS — every member shares one T
  push(item: T): void
  pop(): T | undefined
}

class Utils {
  identity<T>(value: T): T   // on the METHOD — a fresh T per call
}
```

Put it on the **class** when the instance is "a container of T" — the whole
object is about that one type. Put it on the **method** when each call is
independent of the instance.

Getting this wrong is a common design smell: a class-level `T` used by only one
method should have been a method-level parameter.

## Passing the parameter through to an interface

```ts
class InMemoryRepository<T extends Identifiable> implements Repository<T>
```

Three details:

1. The class declares its **own** `T`.
2. It passes that `T` to the interface. `implements Repository` with no
   argument is an error.
3. The constraint is **repeated**. It is not inherited — TypeScript checks that
   your `T` satisfies the interface's constraint, so omitting it fails.

You can also *fix* the parameter if the implementation is specialised:

```ts
class UserRepository implements Repository<User> { … }   // no class-level T
```

## Generic interfaces make fakes trivial

The test builds this in four lines:

```ts
const fake: Repository<User> = {
  add: () => undefined,
  findById: () => undefined,
  remove: () => false,
  all: () => [bob],
};
```

No mocking library, no subclassing, no module interception. That is the
practical payoff of `firstMatching` depending on `Repository<T>` rather than on
`InMemoryRepository<T>` — the same dependency-inversion point as 06/05, now with
the type parameter carried through.

## `.has()` cannot narrow `.get()`

```ts
if (this.#entries.has(key)) {
  const cached = this.#entries.get(key);   // STILL V | undefined
}
```

TypeScript does not connect the two calls — `has` returns a plain `boolean`, not
a predicate about a later `get`. It cannot: nothing stops the map from being
mutated in between.

So the solution checks `has` for **presence semantics**, then still handles the
`undefined` from `get`:

```ts
if (this.#entries.has(key)) {
  const cached = this.#entries.get(key);
  if (cached !== undefined) return cached;
}
```

Why not just `get() !== undefined`? Because a legitimately cached `0` or `""`
would still be returned correctly — but a cached `undefined` (possible when
`V` includes `undefined`) would re-run the factory forever. `has` is the
presence question; `get` is the value question.

> The tidier alternative used by real caches is a sentinel or a wrapper box —
> `Map<K, { value: V }>` — which is the same trick as `once` in 05/03.

## The falsy-cache bug

```ts
if (this.get(key)) { … }              // re-computes for 0, "", false, NaN
if (this.get(key) !== undefined) { }  // better, but not for cached undefined
if (this.has(key)) { … }              // asks the right question
```

The test pins a factory returning `0` and asserts it is called exactly **once**.
This is the third appearance of falsy-versus-missing in this repo (02/04, 05/03,
07/01) because it is genuinely the most common bug of its kind.

## Small design notes

- **`pop()` returns `T | undefined`** because the stack may be empty. That is
  `Array.prototype.pop`'s own type, so no extra work.
- **`all()` returns `readonly T[]`** — a defensive view. The array is freshly
  built by `[...values()]`, so mutating it would be harmless, but the type
  documents intent (02/02).
- **`remove` returns `Map.delete`'s boolean** directly — the API already answers
  "was anything there?".
- **`Cache<K, V>` leaves `K` unconstrained** so object keys work. `Map` compares
  keys by SameValueZero, i.e. by reference for objects — which is exactly what
  the "different reference" test checks.

## Common mistakes

| Mistake | What happens |
|---|---|
| `implements Repository` without `<T>` | Compile error — the interface needs its argument |
| Omitting `extends Identifiable` on the class | The constraint is not inherited; `implements` fails |
| `getOrCompute` checking `get(key)` truthiness | Factory re-runs for a cached `0`; the test catches it |
| `peek()` using `#items[0]` | That is the bottom of the stack, not the top |
| `all(): T[]` | Works, but the `readonly` assertion fails |
| `firstMatching(repo: InMemoryRepository<T>, …)` | The plain-object fake stops compiling |

## Interview angle

> *"When do you put a type parameter on the class versus on the method?"*

On the class when the instance *is* a container of that type — `Stack<T>`,
`Cache<K, V>`, `Observable<T>`. On the method when each call is independent.
Then the tell: a class-level parameter used by only one method should have been
method-level.

> *"How would you test a service that depends on a database?"*

Depend on a generic interface and pass a plain-object fake, exactly as the test
does here. Four lines, no mocking framework. The generic parameter means the
fake is fully typed too, so a signature change breaks the fake at compile time
rather than at runtime.
