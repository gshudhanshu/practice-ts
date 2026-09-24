# Section 12 — Experimental (legacy) decorators

Maps to the decorators material in the course, which was recorded before TC39
settled on a design and therefore teaches this flavour.

Section 11 is the standard one — on by default, no flag, the version JavaScript
itself is getting. This section is the **other** one, enabled per project by

```json
{ "compilerOptions": { "experimentalDecorators": true } }
```

Each exercise here carries that flag in its own `tsconfig.json`; the verifier
honours it, and section 11 deliberately does not have it.

Learn it because you will meet it: **Angular, NestJS, TypeORM, class-validator,
MobX and InversifyJS all still require it**, and the flag is compilation-wide,
so a project is entirely one flavour or entirely the other. Recognising which
one a codebase uses, and being able to write both, is the practical skill.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Legacy method decorators](01-legacy-method-decorators/) | Core | 25 min | `(target, propertyKey, descriptor)`, mutating vs returning a descriptor, static vs instance `target` |
| 02 | [Property & parameter decorators](02-legacy-property-and-parameter-decorators/) | Core | 30 min | Side tables, `@required`/`@validate`, constructor injection, `emitDecoratorMetadata` |
| 03 | [Migrating to standard](03-migrating-to-standard/) | **Challenge** | 40 min | Both flavours side by side, a hand-written `__esDecorate`, two `@bound`s |

**Run one:** `npm run check 12/01` · **Run the section:** `npm run check 12`

## What to take away

- **The legacy signature is `(target, propertyKey, descriptor)`** for methods,
  `(target, propertyKey)` for properties, and
  `(target, propertyKey, parameterIndex)` for parameters. Standard is always
  `(value, context)`.
- **`target` is the prototype for instance members and the constructor for
  statics.** There is no flag saying which; you infer it from
  `typeof target === "function"`. Standard replaced this with `context.static`.
- **You get the whole `PropertyDescriptor`,** so legacy can do things standard
  cannot — `writable: false` needs one line and has no standard equivalent.
  Mutate it, or return a new one, which replaces it wholesale.
- **Property and parameter decorators can only record.** They cannot see values,
  intercept writes, or change types. Everything they enable — validation,
  injection, serialisation — is "annotate now, read later", with a method or
  class decorator doing the reading.
- **Parameter decorators apply right to left.** Store by index; a `push`
  silently reverses your tokens.
- **`emitDecoratorMetadata` + `reflect-metadata`** is what lets a container read
  `design:paramtypes` and inject by type instead of by token. It needs a runtime
  polyfill, and it flattens unions and interfaces to `Object`.
- **Decorators never change types**, in either flavour. They are runtime
  functions; the declaration decides the type.
- **The two flavours cannot be mixed.** The flag is compilation-wide, so
  migration is all-or-nothing — and standard decorators have no parameter
  decorators at all, which is precisely what blocks Angular and NestJS.

## Interview questions this section prepares you for

- What arguments does a TypeScript method decorator receive? (Ask which
  flavour — that alone is a good answer.)
- Why is `target` sometimes a prototype and sometimes a constructor?
- How would you make a method non-writable with a decorator?
- How does NestJS know what to inject into a constructor?
- What does `emitDecoratorMetadata` actually emit, and what does it need at
  runtime?
- Can a decorator make a property required, or narrow its type?
- **TypeScript has two decorator implementations — what is the difference, and
  can you mix them?** (12/03 is the full answer.)
- Could you migrate an Angular or NestJS app to standard decorators today?
