# TypeScript Cheat Sheet

A complete reference for the whole language, not just the exercises built so
far. Two layers:

- **[Quick reference](#quick-reference)** — dense syntax tables for the 30-second lookup.
- **Detailed sections** — worked examples, gotchas, and the interview angle.

Every ```ts snippet in this file is compiled under this repo's strict config by
`npm run check:cheatsheet`, so nothing here is pseudo-code that does not
actually work.

Links like → [02/03](exercises/02-essentials/03-tuples-and-const-assertions/)
point at the exercise that drills the topic. All 21 sections are built, so every
topic below has exercises behind it.

---

## Quick reference

### Types

| Syntax | Meaning |
|---|---|
| `string` `number` `boolean` `bigint` `symbol` | primitives |
| `null` `undefined` | nullish (distinct types under `strictNullChecks`) |
| `"a" \| "b"` | union of string literals |
| `A & B` | intersection |
| `T[]` / `Array<T>` | array |
| `readonly T[]` | immutable array |
| `[string, number]` | tuple |
| `[a: string, b?: number, ...rest: boolean[]]` | labelled / optional / rest tuple |
| `Record<K, V>` | object with keys `K` |
| `{ [key: string]: V }` | index signature |
| `() => void` | function type |
| `new () => T` | constructor type |
| `unknown` / `any` / `never` / `void` | top, unsafe-top, bottom, no-value |
| `object` | any non-primitive |

### Operators on types

| Syntax | Meaning |
|---|---|
| `keyof T` | union of `T`'s keys |
| `typeof x` | the type of value `x` |
| `T[K]` | indexed access |
| `T["a"]["b"]` | nested access |
| `(typeof ARR)[number]` | union of an array's element types |
| `T extends U ? X : Y` | conditional |
| `infer U` | capture a type inside a conditional |
| `{ [K in keyof T]: … }` | mapped type |
| `` `on${Capitalize<T>}` `` | template literal type |
| `x as T` | assertion (unchecked) |
| `x satisfies T` | check without widening |
| `x as const` | infer narrowest / readonly |
| `x!` | non-null assertion (avoid) |

### Modifiers

| Syntax | Meaning |
|---|---|
| `a?: T` | optional property |
| `readonly a: T` | immutable property |
| `-readonly` / `-?` | remove modifier in a mapped type |
| `public` `private` `protected` | class visibility (compile-time) |
| `#field` | true private (runtime) |
| `static` · `abstract` · `override` | class member modifiers |
| `declare` | ambient — types only, no emit |

### Built-in utility types

| Type | Result |
|---|---|
| `Partial<T>` / `Required<T>` | all optional / all required |
| `Readonly<T>` | all `readonly` |
| `Pick<T, K>` / `Omit<T, K>` | keep / drop keys |
| `Record<K, V>` | `{ [P in K]: V }` |
| `Exclude<T, U>` / `Extract<T, U>` | filter a **union** |
| `NonNullable<T>` | drop `null` and `undefined` |
| `ReturnType<F>` / `Parameters<F>` | function's return / args tuple |
| `InstanceType<C>` / `ConstructorParameters<C>` | class instance / ctor args |
| `Awaited<T>` | unwrap nested promises |
| `NoInfer<T>` | block inference at this position (TS 5.4) |
| `Uppercase` `Lowercase` `Capitalize` `Uncapitalize` | string literal transforms |

### CLI

| Command | Does |
|---|---|
| `npx tsc --init` | create a `tsconfig.json` |
| `npx tsc` | compile the project |
| `npx tsc --noEmit` | typecheck only |
| `npx tsc --watch` | recompile on change |
| `npx tsc --showConfig` | print the resolved config |
| `node --experimental-strip-types x.ts` | run TS directly (Node 22+) |

---

## Setup

```bash
npm install -D typescript
npx tsc --init
```

A minimal modern `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,          // let the bundler emit; tsc just checks
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
```

TypeScript is a **typechecker**, not a runtime. Nothing it does survives to
JavaScript except erasure. In most modern projects the bundler (Vite, esbuild,
swc) does the transpiling and `tsc --noEmit` only checks — which is why
`isolatedModules` matters.

Node 22+ can run `.ts` files directly by stripping types
(`node --experimental-strip-types`), which is why `--erasableSyntaxOnly` exists
and why `enum`, `namespace` and parameter properties are increasingly avoided.

---

## Basic types

```ts
const name: string = "Ada";
const age = 36;                    // inferred: number
const active: boolean = true;
const big: bigint = 9007199254740993n;
const key: symbol = Symbol("id");
const nothing: null = null;
const missing: undefined = undefined;

const ids: number[] = [1, 2, 3];
const pairs: Array<[string, number]> = [["a", 1]];
const anything: unknown = JSON.parse("{}");
```

### Type aliases, unions, intersections

```ts
type Id = string | number;                  // union — one OR the other
type Point = { x: number; y: number };
type Named = { name: string };
type NamedPoint = Point & Named;            // intersection — BOTH

const p: NamedPoint = { x: 1, y: 2, name: "origin" };
```

A union is a choice; an intersection is a combination. The confusing part:
`A & B` has *more* properties but *fewer* valid values, while `A | B` has fewer
guaranteed properties but more valid values.

Intersecting primitives gives `never` (nothing is both a `string` and a
`number`):

```ts
type Impossible = string & number;   // never
```

→ [02/04](exercises/02-essentials/04-unions-and-narrowing/)

### Enums vs unions — prefer the union

```ts
const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];   // "debug" | "info" | "warn" | "error"
```

| | union of literals | `enum` |
|---|---|---|
| Runtime output | none | emits a real object |
| Typing | structural | **nominal** — a plain `"debug"` is not `Level.Debug` |
| Iterable at runtime | via the `as const` array | yes |
| `erasableSyntaxOnly` | fine | **rejected** |

Enum syntax, for when you meet it:

```ts
enum Direction { Up, Down }              // numeric: Up = 0, Down = 1
enum Status { Active = "ACTIVE" }        // string enum — no reverse mapping
const dir: Direction = Direction.Up;
```

Numeric enums also create a **reverse mapping** (`Direction[0] === "Up"`), which
means `Object.keys` on one returns both names and numbers — a classic surprise.

→ [02/03](exercises/02-essentials/03-tuples-and-const-assertions/)

### Tuples & readonly

```ts
type Coordinate = [latitude: number, longitude: number];  // labels are docs only
type Rgb = readonly [number, number, number];
type Args = [name: string, age?: number, ...flags: boolean[]];

declare const coord: Coordinate;
const [lat, lon] = coord;        // number, number — exact, no `| undefined`

declare const list: string[];
const [first] = list;            // string | undefined — length unknown
```

That difference is the everyday payoff of tuples: the compiler knows a tuple's
length, so destructuring needs no guard.

```ts
type Book = {
  id: string;
  tags: readonly string[];   // no push/pop/splice — compile-time only, shallow
};
```

`readonly T[]` as a **parameter** accepts more callers *and* documents that you
will not mutate. → [02/02](exercises/02-essentials/02-object-and-array-types/)

---

## Inference & annotation

```ts
const a = 0.08;          // 0.08     const narrows primitives to literals
let   b = 0.08;          // number   let widens
const c: number = 0.08;  // number   the annotation WIDENS — usually a mistake

const arr = ["a", "b"];             // string[]
const tup = ["a", "b"] as const;    // readonly ["a", "b"]
```

**Rule: annotate to *constrain*, never to *restate*.** Annotate exported
boundaries — so an error lands at the mistake rather than at some distant call
site — and let locals infer.

**Contextual typing** pushes types inward, which is why callbacks rarely need
annotations:

```ts
type Transformer = (value: number) => number;
const double: Transformer = (value) => value * 2;   // value: number, inferred
```

→ [02/01](exercises/02-essentials/01-primitives-and-inference/)

---

## Narrowing & type guards

| Check | Narrows |
|---|---|
| `typeof x === "string"` | primitives |
| `x.kind === "circle"` | **discriminated union — the default for objects** |
| `"email" in x` | object union with no discriminant |
| `x instanceof Date` | class instances |
| `x != null` | excludes `null` **and** `undefined` |
| `Array.isArray(x)` | `T \| T[]` |
| `isFoo(x): x is Foo` | anything (type predicate) |
| `assertFoo(x): asserts x is Foo` | anything (assertion function) |

### Discriminated unions

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;   // narrowed — no cast
    case "rectangle":
      return shape.width * shape.height;
  }
}
```

Two rules: the **same property name** in every member, with a **distinct
literal type** in each. `kind: string` breaks it entirely.

### Type predicates and assertion functions

```ts
const LEVELS = ["debug", "info"] as const;
type Level = (typeof LEVELS)[number];

function isLevel(value: string): value is Level {
  return LEVELS.some((level) => level === value);
}

function assertLevel(value: string): asserts value is Level {
  if (!isLevel(value)) throw new Error(`bad level: ${value}`);
}

declare const raw: string;
if (isLevel(raw)) {
  const ok: Level = raw;      // narrowed inside the branch
}
assertLevel(raw);
const alsoOk: Level = raw;    // narrowed for the rest of the scope
```

The compiler does **not** verify that your implementation matches the predicate
— `function isLevel(v: string): v is Level { return true; }` compiles. A
predicate is a promise you make.

An assertion function must have an **explicit** type annotation on the variable
holding it if you assign it (`const f: (v: string) => asserts v is Level = …`),
otherwise TypeScript refuses to use it for narrowing.

→ [02/04](exercises/02-essentials/04-unions-and-narrowing/) · [02/06](exercises/02-essentials/06-unknown-and-exhaustiveness/)

### Exhaustiveness

```ts
type Event = { type: "click" } | { type: "scroll" };

function assertNever(value: never): never {
  throw new Error(`unreachable: ${JSON.stringify(value)}`);
}

function handle(event: Event): string {
  switch (event.type) {
    case "click": return "click";
    case "scroll": return "scroll";
    default: return assertNever(event);   // add a member → compile error here
  }
}
```

This turns "handle the new case" from a code-review comment into a build error,
across every non-exhaustive switch at once.

---

## `any` / `unknown` / `never` / `void`

| | Assignable **to** it | Assignable **from** it |
|---|---|---|
| `any` | everything | everything — checking off, and **contagious** |
| `unknown` | everything | nothing until narrowed |
| `never` | nothing | everything |

```ts
function safeJsonParse(raw: string): unknown {
  try {
    const parsed: unknown = JSON.parse(raw);   // contain `any` at ONE line
    return parsed;
  } catch {
    return undefined;
  }
}
```

`void` returns *with no value*; `never` **does not return at all**. A call to a
`never`-returning function terminates control flow, which is what makes this
work with no `!`:

```ts
function fail(message: string): never {
  throw new Error(message);
}

function getOrFail(value: string | null): string {
  if (value === null) fail("missing");
  return value;                              // narrowed to string
}
```

→ [02/06](exercises/02-essentials/06-unknown-and-exhaustiveness/)

---

## Functions

```ts
type Transformer = (value: number) => number;      // param names are docs only

function withRest(...values: number[]): number {   // rest — always last
  return values.length;
}

function withDefault(separator: string = "-"): string {
  return separator;                                // `string`, not `string | undefined`
}

function withThis(this: { name: string }): string {
  return this.name;                                // erased at compile time
}
```

Prefer a **default value** over `sep?: string` plus a branch: the body then sees
a plain `string`.

### The `void` return rule

A parameter typed `=> void` accepts a function that returns **anything**:

```ts
function each(items: readonly string[], cb: (item: string) => void): void {
  items.forEach((item) => cb(item));
}

const collected: number[] = [];
each(["a"], (item) => collected.push(item.length));   // push returns number — fine
```

`void` in *parameter position* means "I will ignore your return value". Without
this rule, `arr.forEach(x => list.push(x))` would not compile. It applies only
to assignment — a function whose own declared return type is `void` still
cannot `return 42`.

### Overloads

```ts
function parse(value: string): string[];
function parse(value: number): number[];
function parse(value: string | number): string[] | number[] {
  return typeof value === "string" ? [value] : [value];
}

const s = parse("a");   // string[]
const n = parse(1);     // number[]
```

The **implementation signature is not callable** — only the overload signatures
above it are. It must be compatible with all of them.

Overloads are the tool when the return type depends on the argument type in a
way a union cannot express. Usually a **generic** or a union is clearer; reach
for overloads only when those genuinely fail.

→ [02/05](exercises/02-essentials/05-function-types-and-callbacks/)

---

## Objects & index signatures

```ts
type Settings = {
  theme: "light" | "dark";     // required
  fontSize?: number;           // optional
  readonly id: string;         // immutable
};

type Lookup = { [key: string]: number };   // index signature
type Fixed = Record<"a" | "b", number>;    // closed key set — usually better
```

Under `noUncheckedIndexedAccess`, reading an index signature yields
`V | undefined`:

```ts
declare const scores: Record<string, number>;
const one = scores["missing"];   // number | undefined
```

### `exactOptionalPropertyTypes`

```ts
type A = { a?: string };              // may be ABSENT
type B = { a: string | undefined };   // must be PRESENT, may hold undefined
type C = { a?: string | undefined };  // either
```

Why it matters: object spread copies keys holding `undefined`, so a patch
**erases** your defaults:

```ts
const merged = { ...{ port: 3000 }, ...{ port: undefined } };
//    { port: undefined } — the default is gone
```

→ [03/03](exercises/03-tsconfig/03-exact-optional-property-types/)

---

## Classes

```ts
class Account {
  static readonly MAX = 100;        // literal type 100, not number
  static #created = 0;              // private static
  #balance: number;                 // runtime-private

  private constructor(              // forces construction through a factory
    public readonly owner: string,  // parameter property: declares AND assigns
    openingCents: number,
  ) {
    this.#balance = openingCents;
  }

  static open(owner: string, cents: number): Account {
    if (!Number.isInteger(cents) || cents < 0) throw new RangeError("bad opening");
    Account.#created += 1;
    return new Account(owner, cents);
  }

  get balance(): number {           // read-only view — no setter
    return this.#balance;
  }

  static get created(): number {
    return Account.#created;
  }
}
```

| | own class | subclasses | outside | at runtime |
|---|---|---|---|---|
| `public` | ✓ | ✓ | ✓ | — |
| `protected` | ✓ | ✓ | ✗ | — |
| `private` | ✓ | ✗ | ✗ | **erased** — readable via `obj["x"]` |
| `#field` | ✓ | ✗ | ✗ | **enforced by the engine** |

`private` is per-**class**, not per-instance: `other.privateField` compiles
inside the same class. `#field` cannot be a parameter property.

→ [06/01](exercises/06-classes-interfaces/01-class-fundamentals/) · [06/02](exercises/06-classes-interfaces/02-static-getters-setters/)

### Abstract classes & `override`

```ts
abstract class Employee {
  constructor(public readonly name: string) {}

  abstract get role(): string;              // contract
  abstract monthlyPayCents(): number;

  describe(): string {                      // shared behaviour using the contract
    return `${this.name} (${this.role})`;   // ← template-method pattern
  }
}

class Contractor extends Employee {
  get role(): string { return "Contractor"; }        // no `override` (abstract)
  monthlyPayCents(): number { return 500_000; }

  override describe(): string {                      // REQUIRED (concrete member)
    return `${super.describe()} [contract]`;
  }
}
```

`override` is a compile-time assertion that the member really does override
something. It stops a base-class rename turning every subclass override into
silently dead code. Required by `noImplicitOverride`.

→ [06/03](exercises/06-classes-interfaces/03-abstract-and-inheritance/)

---

## `interface` vs `type`

| | `interface` | `type` |
|---|---|---|
| Object shapes | ✓ | ✓ |
| Unions, tuples, primitives, mapped, conditional | ✗ | ✓ |
| Declaration merging | ✓ | ✗ |
| Combine with | `extends A, B` | `A & B` |
| Class can `implements` it | ✓ | ✓ (object types) |

Only two rows force the answer: **unions need `type`**, **merging needs
`interface`**.

```ts
interface Identified { id: string }
interface Timestamped { createdAt: string }
interface Entity extends Identified, Timestamped { name: string }

interface AppConfig { apiUrl: string }
interface AppConfig { debug: boolean }   // MERGED into one type
```

Merging is how library augmentation works. It is also why some teams prefer
`type` for internal models — an interface can be silently widened from anywhere.

`extends` reports a conflict at the declaration; `&` silently produces `never`
for the conflicting property and defers the error to every use site.

`implements` is a **check**, not inheritance: it moves the error onto the class
and contributes no types — unannotated method params stay implicitly `any`.

→ [06/04](exercises/06-classes-interfaces/04-interfaces-vs-type-aliases/)

---

## Generics

A generic is a *parameter for a type*. → [08/01](exercises/08-generics/01-generic-functions/)

 The point is to relate
inputs to outputs, not merely to accept anything — if a type parameter appears
only once in a signature, you probably wanted `unknown`.

```ts
function identity<T>(value: T): T {
  return value;
}

const a = identity("hi");        // string — inferred, no need for identity<string>
const b = identity<number>(1);   // explicit when inference cannot work
```

### Constraints, defaults, multiple parameters

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest("abc", "de");            // string
longest([1, 2], [3]);            // number[]

function pluck<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}

const name = pluck({ id: 1, name: "Ada" }, "name");   // string — not any

type Box<T = string> = { value: T };                  // default type argument
const boxed: Box = { value: "defaults to string" };
```

`K extends keyof T` returning `T[K]` is the single most useful generic pattern
in day-to-day code: the return type follows the key you passed.

### Generic classes and interfaces

```ts
interface Repository<T extends { id: string }> {
  add(item: T): void;
  findById(id: string): T | undefined;
}

class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  #items = new Map<string, T>();

  add(item: T): void {
    this.#items.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.#items.get(id);
  }
}

const users = new InMemoryRepository<{ id: string; email: string }>();
users.add({ id: "1", email: "a@b.c" });
const found = users.findById("1");   // { id: string; email: string } | undefined
```

### `const` type parameters and `NoInfer`

```ts
// Without `const`, T widens to string[]; with it, the literal tuple survives.
function asTuple<const T extends readonly unknown[]>(values: T): T {
  return values;
}
const t = asTuple(["a", "b"]);   // readonly ["a", "b"]

// NoInfer stops a parameter from participating in inference (TS 5.4+).
function withFallback<T>(values: readonly T[], fallback: NoInfer<T>): T {
  return values[0] ?? fallback;
}
withFallback(["a", "b"], "c");   // T is inferred from `values` only
```

---

## Type operations

### `as`, `satisfies`, `as const`

Three things that look related and are not:

```ts
type Level = "debug" | "info";

const a = "debug" as Level;                    // ASSERTION — you overriding the compiler
const b = { level: "debug" } satisfies { level: Level };   // CHECK, no widening
const c = ["debug", "info"] as const;          // CONST ASSERTION — infer narrowest
```

`as` reduces safety: it is the main way to lie in TypeScript. It can only widen
or narrow along an existing relationship — `"x" as number` is an error, and
`x as unknown as T` is the double-assertion escape hatch (a red flag).

`satisfies` (TS 4.9+) checks a value against a type **without changing the
inferred type** — the answer to "I want this validated but I also want narrow
inference":

```ts
const config = {
  host: "localhost",
  port: 3000,
} satisfies Record<string, string | number>;

const port: number = config.port;   // still number, not string | number
```

The idiom for a checked literal list is both together:

```ts
type Flag = "strict" | "noEmit";
const FLAGS = ["strict", "noEmit"] as const satisfies readonly Flag[];
type Used = (typeof FLAGS)[number];   // "strict" | "noEmit"
```

`as const` also makes object properties `readonly` and arrays readonly tuples.

### `keyof`, `typeof`, indexed access

```ts
type User = { id: string; age: number };

type UserKeys = keyof User;          // "id" | "age"
type Age = User["age"];              // number
type Either = User["id" | "age"];    // string | number

const defaults = { retries: 3, verbose: false };
type Defaults = typeof defaults;     // { retries: number; verbose: boolean }

const ROLES = ["admin", "guest"] as const;
type Role = (typeof ROLES)[number];  // "admin" | "guest"
```

`typeof` in *type position* is the type query operator — unrelated to the
runtime `typeof` operator. Deriving types from values (`typeof defaults`) keeps
them from drifting apart.

Note that indexed **access types** are not affected by
`noUncheckedIndexedAccess`; that flag applies to expressions.

→ [10/01](exercises/10-deriving-types/01-keyof-and-typeof/) · [10/02](exercises/10-deriving-types/02-indexed-access/)

---

## Utility types

All of these are built in, and all are worth being able to hand-roll — which is
exactly what [section 20](exercises/20-utility-types-from-scratch/) drills.

```ts
type User = { id: string; name: string; email?: string };

type A = Partial<User>;                // every property optional
type B = Required<User>;               // every property required
type C = Readonly<User>;               // every property readonly
type D = Pick<User, "id" | "name">;    // { id: string; name: string }
type E = Omit<User, "email">;          // { id: string; name: string }
type F = Record<"a" | "b", number>;    // { a: number; b: number }
```

Union filters — these distribute over unions, unlike the object helpers above:

```ts
type G = Exclude<"a" | "b" | "c", "c">;      // "a" | "b"
type H = Extract<"a" | "b", "a" | "z">;      // "a"
type I = NonNullable<string | null>;         // string
```

Function and class helpers:

```ts
declare function send(to: string, body: string): Promise<number>;

type J = ReturnType<typeof send>;            // Promise<number>
type K = Parameters<typeof send>;            // [to: string, body: string]
type L = Awaited<ReturnType<typeof send>>;   // number

class Service { run(): void {} }
type M = InstanceType<typeof Service>;       // Service
type N = ConstructorParameters<typeof Service>;  // []
```

String literal helpers:

```ts
type O = Uppercase<"abc">;      // "ABC"
type P = Capitalize<"abc">;     // "Abc"
type Q = Uncapitalize<"Abc">;   // "abc"
```

### Gotchas

- `Omit` does **not** check that the key exists — `Omit<User, "typo">` compiles
  silently. `Exclude<keyof T, …>` based helpers are stricter.
- `Partial<T>` produces *exact* optional properties, so under
  `exactOptionalPropertyTypes` a patch type usually needs
  `{ [K in keyof T]?: T[K] | undefined }` instead.
- `ReturnType<F>` silently yields **`any`** when `F` has a `never` parameter —
  see [Gotchas](#gotchas-found-building-this-repo).

---

## Mapped, conditional & template literal types

→ [10/03](exercises/10-deriving-types/03-mapped-types/) · [10/04](exercises/10-deriving-types/04-conditional-types/) · [10/05](exercises/10-deriving-types/05-template-literal-types/)

### Mapped types

```ts
type User = { readonly id: string; name?: string };

type MyPartial<T> = { [K in keyof T]?: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };     // strip readonly
type Concrete<T> = { [K in keyof T]-?: T[K] };            // strip optional

type Renamed = { [K in keyof User as `get${Capitalize<string & K>}`]: () => User[K] };
//    { getId: () => string; getName: () => string | undefined }
```

The `as` clause remaps keys, and mapping a key to `never` **removes** it — that
is how a "pick by value type" helper is built:

```ts
type Source = { a: string; b: number; c: string };
type StringKeys<T> = { [K in keyof T as T[K] extends string ? K : never]: T[K] };
type OnlyStrings = StringKeys<Source>;   // { a: string; c: string }
```

### Conditional types & `infer`

```ts
type IsString<T> = T extends string ? true : false;

type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type X = ElementOf<string[]>;            // string

type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;
type Y = DeepAwaited<Promise<Promise<number>>>;   // number
```

**Distribution** is the part that surprises people. A conditional over a *naked*
type parameter distributes across a union:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type Distributed = ToArray<string | number>;      // string[] | number[]

type NoDistribute<T> = [T] extends [unknown] ? T[] : never;
type Together = NoDistribute<string | number>;    // (string | number)[]
```

Wrapping both sides in a tuple (`[T] extends [U]`) turns distribution off. That
is also why `IsNever<T>` must be written `[T] extends [never]` — a naked `never`
distributes over zero union members and yields `never`.

### Template literal types

```ts
type Event = "click" | "focus";
type Handler = `on${Capitalize<Event>}`;    // "onClick" | "onFocus"

type Path = `/${string}`;
const route: Path = "/users";

type CssUnit = `${number}px` | `${number}rem`;
const size: CssUnit = "12px";
```

Combining two unions multiplies them, so these can explode combinatorially —
TypeScript caps the resulting union size, and you will meet the cap sooner than
you expect.

---

## Decorators

→ [11/01](exercises/11-decorators/01-method-decorators/) · [12](exercises/12-experimental-decorators/) · [13](exercises/13-decorators-practice/)

TypeScript 5 introduced the **standard** (Stage 3) decorators.
They are enabled by default with `target: ES2022` or later, and are a different
API from the old `experimentalDecorators` ones you will find in older tutorials
and in Angular/NestJS.

```ts
function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return function (this: This, ...args: Args): Return {
    console.log(`-> ${String(context.name)}`);
    return target.call(this, ...args);
  };
}

class Service {
  @logged
  fetch(id: string): string {
    return `item ${id}`;
  }
}
```

The `context` object carries `kind`, `name`, `static`, `private`, and an
`addInitializer` hook. Decorator kinds: class, method, getter, setter, field,
and accessor.

Legacy decorators (`experimentalDecorators: true`) have a completely different
signature — `(target, propertyKey, descriptor)` — and are still required by
Angular and NestJS, and by `reflect-metadata` / `emitDecoratorMetadata`. The two
systems cannot be mixed in one project.

---

## Modules & declaration files

```text
// named / default / namespace
export const a = 1;
export default function main() {}
export * from "./other";
export { thing as renamed } from "./other";

import main, { a } from "./mod";
import * as everything from "./mod";

// TYPE-ONLY — erased entirely, required by verbatimModuleSyntax
import type { User } from "./types";
import { type User, getUser } from "./api";
export type { User };
```

`import type` matters more than it looks: with `verbatimModuleSyntax`, imports
are emitted exactly as written, so a value import of a module with side effects
is preserved and a type import is erased. That kills a class of bug where a
module silently stopped being loaded.

### Declaration files

`.d.ts` files describe shapes with no implementation. You write them to type an
untyped dependency, or to augment an existing one.

```text
// types/legacy-lib.d.ts
declare module "legacy-lib" {
  export function greet(name: string): string;
}

// widen an existing module (module augmentation)
declare module "express" {
  interface Request {
    user?: { id: string };
  }
}
```

Augmenting globals works from inside any module:

```ts
declare global {
  interface Window {
    myAnalytics?: { track(event: string): void };
  }
}
```

`declare` means "this exists at runtime, trust me" — it emits nothing. Getting
it wrong produces a lie the compiler will happily propagate.

Namespaces (`namespace Foo { }`) are the pre-modules module system. You will
meet them in older code and in `.d.ts` files; do not write new ones.

→ [14](exercises/14-modules-namespaces/) · [15](exercises/15-build-tools/) · [16](exercises/16-libs-and-ts/)

---

## tsconfig

`"strict": true` is exactly these **eight**:

`noImplicitAny` · `strictNullChecks` · `strictFunctionTypes` ·
`strictBindCallApply` · `strictPropertyInitialization` · `noImplicitThis` ·
`alwaysStrict` · `useUnknownInCatchVariables`

Valuable flags it does **not** include:

```jsonc
{
  "noUncheckedIndexedAccess": true,    // arr[0] is T | undefined
  "exactOptionalPropertyTypes": true,  // absent ≠ present-and-undefined
  "noImplicitOverride": true,          // `override` mandatory
  "noFallthroughCasesInSwitch": true,
  "noPropertyAccessFromIndexSignature": true,
  "verbatimModuleSyntax": true,        // imports emitted exactly as written
  "isolatedModules": true              // each file transpilable alone
}
```

They are excluded because `strict` is curated to stay **adoptable**, not because
they are unimportant. Migration advice that actually works: enable one sub-flag
at a time, land each as its own PR.

### `noUncheckedIndexedAccess` survival kit

```ts
declare const values: string[];

for (const v of values) {
  v.toUpperCase();                   // T — no `| undefined`
}

values.slice(0, 2);                  // no element access at all

const a = values[0];
if (a !== undefined) a.toUpperCase();   // narrow into a LOCAL
```

`i < arr.length` does **not** narrow `arr[i]` — TypeScript has no dependent
types. → [03/02](exercises/03-tsconfig/02-unchecked-indexed-access/)

---

## Modern JavaScript essentials

### Nullish operators

```ts
declare const obj: { a?: { items?: string[] } } | undefined;
declare const fn: (() => number) | undefined;
declare const index: number;

const v1 = obj?.a?.items;            // optional property
const v2 = obj?.a?.items?.[index];   // optional index — note the dot before [
const v3 = fn?.();                   // optional call  — note the dot before (

declare const port: number | undefined;

const a = port ?? 3000;   // port === 0  ->  0     (nullish only)
const b = port || 3000;   // port === 0  ->  3000  (also "", NaN, false)
```

`a ?? b || c` is a **syntax error** on purpose — parenthesise.

Logical assignment short-circuits the *write* itself, which matters for setters
and reactive frameworks:

```ts
const visits: { count?: number } = {};
visits.count ??= 0;      // assigns only if nullish
visits.count += 1;
```

`??` is the safer default; `||` is correct when `""` or `0` genuinely means
"absent". → [05/04](exercises/05-modernjs/04-optional-chaining-and-nullish/)

### Destructuring & spread

```ts
declare const point: { x: number; y: number };
declare const user: { title?: string; address?: { city?: string } };

const { x: longitude } = point;                  // RENAME (not annotate)
const { title = "friend" } = user;               // default on undefined ONLY
const { address: { city = "?" } = {} } = user;   // nested — parent needs a default

const renamed = { ...user, title: "Dr" };        // override AFTER the spread
```

**Spread is shallow.** An immutable nested update needs a fresh object at every
level on the path:

```ts
type State = { user: { address: { city: string } }; version: number };
declare const state: State;

const next: State = {
  ...state,
  user: { ...state.user, address: { ...state.user.address, city: "Paris" } },
  version: state.version + 1,
};
```

That structural sharing is what makes `React.memo` and `useMemo` work.
→ [05/01](exercises/05-modernjs/01-destructuring/) · [05/02](exercises/05-modernjs/02-spread-and-rest/)

### `this`

`this` in a **normal** function comes from the call site: `new Fn()` → instance ·
`fn.call(x)` → `x` · `obj.fn()` → `obj` · `fn()` → `undefined` (modules are
strict mode). An **arrow** function has no `this` — it captures the enclosing
one, and `.call`/`.bind` cannot change it.

```ts
class Timer {
  #ticks = 0;
  tick = (): void => {          // arrow FIELD — survives detachment
    this.#ticks += 1;
  };
  get count(): number { return this.#ticks; }
}

const timer = new Timer();
const detached = timer.tick;
detached();                     // still works
```

Cost: an arrow field allocates per instance and is not on the prototype (so it
is harder to spy on, and `super` cannot reach it).
→ [05/03](exercises/05-modernjs/03-arrow-functions-and-this/)

### Array methods

```ts
declare const orders: { customer: string; items: string[] }[];

const allItems = orders.flatMap((o) => o.items);      // map + flatten, one pass
const unique = [...new Set(allItems)];                // dedupe, order preserved

declare const maybe: (string | null)[];
const present = maybe.filter((v) => v != null);       // string[] — TS 5.5 infers the predicate
```

Mutating: `sort` `reverse` `splice` `push` `pop` `fill` `copyWithin`.
Non-mutating (ES2023): `toSorted` `toReversed` `toSpliced` `with`.

Chaining comparators — `0` is the only falsy comparator result:

```ts
declare const rows: { total: number; name: string }[];
rows.sort((a, b) => b.total - a.total || (a.name < b.name ? -1 : 1));
```

`reduce` to a **primitive**; loop to an **object** (spreading an accumulator is
O(n²)). → [05/05](exercises/05-modernjs/05-array-pipelines/)

---

## Patterns worth naming in an interview

| Pattern | Where |
|---|---|
| Make illegal states unrepresentable (discriminated union) | 02/04, 04/01 |
| Parse, don't validate (return the type, not a boolean) | 02/06, 04/02 |
| Exhaustiveness via `assertNever` | 02/06 |
| Single source of truth (`as const` + `[number]`) | 02/03 |
| Contain `any` at the boundary, hand back `unknown` | 02/06 |
| Private constructor + static factory | 06/02 |
| Template method (abstract base + abstract hook) | 06/03, 06/06 |
| Decorator (implements the interface it consumes) | 06/05 |
| Dependency inversion (depend on the interface) | 06/05, 06/06 |
| Invariants enforced in exactly one place | 06/06 |
| Branded types for nominal typing | 22/01 |
| `Result<T, E>` instead of throwing | 22/02 |

---

## Compile-time assertions

```ts
type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

declare function parsePrice(raw: string): number | null;
type _check = Expect<Equal<ReturnType<typeof parsePrice>, number | null>>;
```

The deferred-conditional trick compares types **invariantly**. A naive
`X extends Y ? true : false` would wrongly report `any`, `never` and union
subtypes as equal. Helpers live in
[`src/type-testing.ts`](src/type-testing.ts).

## Gotchas found building this repo

**`ReturnType<F>` is `any` when `F` has a `never` parameter.**
`ReturnType` is `F extends (...args: any) => infer R ? R : any`, and matching
requires `any` to be assignable to the parameter — `never` is the one type it is
not. The conditional fails and falls through to `any`. Compare the whole
signature instead:

```ts
import type { Equal, Expect } from "./src/type-testing";

declare function assertNever(value: never): never;

type Wrong = ReturnType<typeof assertNever>;   // any (!)
type Right = Expect<Equal<typeof assertNever, (value: never) => never>>;
```

**`@ts-expect-error` silences the compiler, but the statement still runs.** A
`push` onto a `readonly` array really mutates it — `readonly` is erased. Keep
negative assertions inside a function that is never called.

**A call to a `never`-returning function makes everything after it
unreachable**, and narrowing is not computed in unreachable code. A stray
`assertNever(x)` in the middle of a test silently disabled every assertion below
it.

**Destructuring a tuple gives exact types; destructuring an array gives
`| undefined`.** The compiler knows a tuple's length and not an array's.
