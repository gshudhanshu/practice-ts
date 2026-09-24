# 12/02 — Legacy property and parameter decorators

## Why they cannot change types

A decorator is a function that runs at runtime, once, while the class is being
defined. A type is a compile-time artefact fixed by the declaration. There is no
channel between them — TypeScript reads your source, decides that `email` is a
`string`, and then emits a call to `label("Email address")`. Nothing that call
does can travel backwards into the type.

Concretely, none of this is possible:

```ts
@label("Email")  email = "";        // still `string`, never `LabelledString`
@required        name: string;      // still `string`, never `NonNullable`
@Inject("x")     dep: Service;      // no inference of Service from the token
```

The one exception people cite is a **class** decorator returning a subclass —
and even there the declared type is unchanged (11/03). So the honest summary is:
decorators change behaviour, never types. Any apparent type effect in a
framework comes from hand-written or generated declarations sitting alongside.

This is why the pattern is always two-sided:

| Half | What it does |
|---|---|
| The annotation (`@required`, `@Inject`) | records a fact in a side table |
| The reader (`@validate`, `resolve`) | acts on it, later, at call or wire time |

`@required` on its own can enforce nothing — it never sees a call. That is not a
limitation to work around; it is the design.

## Parameter decorators, and their two traps

```ts
constructor(
  @Inject("greeting") readonly greeting: string,
  @Inject("name")     readonly name: string,
) {}
```

**`propertyKey` is `undefined`** for a constructor parameter. There is no member
name, because the constructor is not a named member. `target` is the class
itself (not the prototype), which is convenient: it is the natural key for the
side table.

**They apply right to left.** The emitted code is

```js
Greeting = __decorate([
  __param(0, Inject("greeting")),
  __param(1, Inject("name")),
], Greeting);
```

and `__decorate` loops backwards, so `__param(1, …)` runs first. A `push`
therefore records `["name", "greeting"]` and every injected argument lands in
the wrong slot — a bug that produces a working program with swapped values,
which is far worse than a crash. Assign by index and the order stops mattering.

## Signatures are barely checked

TypeScript checks a legacy decorator by trying to call it with the arguments for
that position. A function that takes *fewer* arguments fits anywhere that
supplies at least that many, so:

```ts
class LooselyChecked {
  @label("surprising")   // a PROPERTY decorator …
  method(): void {}      // … silently applied to a METHOD
}
```

compiles cleanly. The standard flavour cannot do this, because each kind has a
distinct, non-overlapping context type — which is exactly why section 11's tests
can assert that misuse fails to compile and this section's cannot.

## `emitDecoratorMetadata` and `reflect-metadata`

This exercise makes you write the side table by hand. The compiler can write
part of it for you:

```json
{ "compilerOptions": { "experimentalDecorators": true, "emitDecoratorMetadata": true } }
```

With that on, every decorated member gets extra emitted calls:

```js
Reflect.metadata("design:type", String)
Reflect.metadata("design:paramtypes", [String, Number])
Reflect.metadata("design:returntype", Number)
```

Three things to know about it:

1. **It needs a runtime polyfill.** `Reflect.metadata` is not part of
   JavaScript. Without `import "reflect-metadata"` as the first import in the
   program, decorated code throws `Reflect.metadata is not a function`. That is
   why it is off in this exercise — the package is not installed, and enabling
   the flag alone would break every test in this directory.
2. **It is the only compile-time type information a decorator ever gets** — and
   it is thin. Types are reduced to constructor references, so `string` becomes
   `String`, and anything the emitter cannot name (a union, an interface, a
   generic parameter) becomes `Object`. `string | number` is `Object`;
   `Foo | undefined` is `Object`.
3. **It is what makes NestJS's `constructor(private users: UserService)` work
   without a token.** The container reads `design:paramtypes`, gets
   `[UserService]`, and looks that class up. `@Inject("token")` is the manual
   fallback for everything metadata cannot express — which is why you still see
   it constantly in NestJS code for interfaces and primitives.

The standard proposal has no equivalent. It provides `context.metadata`, a
shared object on `Symbol.metadata` that decorators can write to and read from,
but nothing populates it with types. There is no standard-decorator replacement
for `design:paramtypes`, and this — plus the total absence of parameter
decorators — is the concrete reason Angular and NestJS have not migrated.

## `resolve`, and why it walks the arity

```ts
for (let index = 0; index < ctor.length; index += 1) {
  const token = tokens[index];
  if (token === undefined) throw new Error(`${ctor.name}: parameter ${index} is not injectable`);
  …
}
```

`Function.length` is the declared parameter count. Iterating the recorded tokens
instead would silently construct with too few arguments when a parameter has no
`@Inject`, passing `undefined` into a dependency slot — the exact failure that
makes DI containers frustrating to debug.

`Reflect.construct(ctor, args)` is the only way to spread a runtime array into
`new`. It returns `any`; assigning it to a `T`-typed local contains that in one
place without a cast.

## Common mistakes

| Mistake | What happens |
|---|---|
| Expecting a property decorator to see or change the value | It gets a name and nothing else |
| `push` in a parameter decorator | Right-to-left application reverses the tokens |
| Typing `propertyKey` as `string` for a constructor parameter | It is `undefined` there |
| Reading the side table in the decorator body instead of the wrapper | Couples the two decorators to their ordering |
| Iterating recorded tokens instead of `ctor.length` | Missing tokens go undetected |
| Turning on `emitDecoratorMetadata` without `reflect-metadata` | `Reflect.metadata is not a function` at import |
| Expecting `design:paramtypes` to describe unions or interfaces | They all come out as `Object` |

## Interview angle

> *"How does NestJS know what to inject into a constructor?"*

Two mechanisms. With `emitDecoratorMetadata`, the compiler emits
`design:paramtypes` — an array of constructor references — which the container
reads via `reflect-metadata` and looks up. Where that is not expressive enough
(interfaces, primitives, unions — all of which emit as `Object`), you supply a
token explicitly with `@Inject("…")`, which is a parameter decorator recording
the token by index. Mention that parameter decorators apply right to left, and
you have shown you have actually read the emit.

> *"Can a decorator make a property required, or narrow its type?"*

No. Decorators run at runtime; types are decided at compile time and there is no
channel from one to the other. What a decorator can do is record a fact that
something else enforces later — which is what `@required` plus `@validate` is,
and what every validation library is underneath.
