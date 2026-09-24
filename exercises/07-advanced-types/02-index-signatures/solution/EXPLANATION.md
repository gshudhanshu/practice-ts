# 07/02 — Index signatures & dynamic keys

## `Record<K, V>` vs `{ [key: K]: V }`

```ts
type A = Record<string, number>;      // mapped type
type B = { [key: string]: number };   // index signature
```

For an open `string` key these are **the same type** — the test proves it with
`Equal<A, B>`. Prefer `Record` when the key set is *closed*
(`Record<"a" | "b", number>`), because a mapped type can do that and an index
signature cannot.

### The `keyof` quirk

Two identical types, two different answers:

```ts
type K1 = keyof Record<string, number>;      // string
type K2 = keyof { [key: string]: number };   // string | number
```

The declared index signature reports `string | number` because JavaScript
stringifies numeric keys, so `obj[0]` is a legal accessor. The mapped form
reports only its constraint, `string`.

It is an inconsistency in the compiler rather than a deep principle, and it
matters exactly when you build helpers over `keyof` — a surprise `number` in
your key union is otherwise very hard to explain.

## An index signature constrains its siblings

```ts
type Config = {
  name: string;                     // OK — string is in the union
  // debug: boolean;                // ERROR — not assignable
  [key: string]: string | number;
};
```

Every **declared** property must be assignable to the index signature's value
type. The reason is soundness: the index signature promises `config["name"]`
yields `string | number`, and `name` is reachable that way too.

The usual workaround when you genuinely need a mixed shape is to stop using an
index signature and model the two halves separately:

```ts
type Config = { name: string; debug: boolean } & { extras: Record<string, string> };
```

Widening the index signature to `string | number | boolean` "fixes" the error
but destroys the type safety of every dynamic read, which is almost always the
wrong trade.

## `noUncheckedIndexedAccess` is what makes this honest

```ts
const messages = translations[locale];   // Record<string,string> | undefined
if (messages === undefined) return fallback;

const message = messages[key];           // string | undefined
return message === undefined ? fallback : message;
```

Two lookups, two possible misses, two checks. Without the flag both reads would
claim to succeed and `translate(catalogue, "de", …)` would return `undefined`
while the type said `string` — the exact bug the flag exists to prevent.

Note `=== undefined` rather than truthiness: a stored `""` is a real
translation, and one of the tests pins that.

## `Object.entries` over `for...in`

```ts
for (const [key, value] of Object.entries(source)) { … }
```

`Object.entries` returns own enumerable pairs. `for...in` walks the **prototype
chain**, so it can pick up inherited properties — a genuine hazard when keys
come from user data or `JSON.parse`.

Typing caveat: `Object.keys` and `Object.entries` are deliberately typed to
return `string` keys, not `keyof T`. That looks like a limitation but is
correct — an object may carry extra properties at runtime, so a narrower type
would be a lie.

## Narrowing changes the type in TODO 5

```ts
const result: Record<string, string> = {};
for (const [key, value] of Object.entries(source)) {
  if (value !== undefined) {
    result[key] = value;      // `value` is `string` here
  }
}
```

You cannot cast `string | undefined` into `string`. Building a **new** record
and assigning only proven-defined values is what legitimately produces the
narrower type. Same "parse, don't validate" shape as 02/06.

## When to use a `Map` instead

Index signatures and `Record` are objects, which brings three hazards:

- **Prototype keys.** `"constructor"`, `"toString"`, `"__proto__"` are inherited
  or special. A cache keyed by user input can behave very strangely.
- **Key ordering.** Integer-like keys are iterated numerically first, before
  string keys in insertion order. Surprising when grouping by numeric id.
- **Keys are strings only.** Objects cannot key on other objects.

Reach for `Map` when keys are arbitrary strings, when insertion order matters,
or when keys are not strings. Use a `Record` when the key set is closed and
safe — as in the union-keyed `Record<Problem, Flag>` back in 03/04.

## `noPropertyAccessFromIndexSignature`

A flag worth knowing (not enabled here):

```ts
config.name;        // always fine — a declared property
config.retries;     // allowed by default; an ERROR under the flag
config["retries"];  // always fine
```

It forces bracket syntax for anything coming from an index signature, so a typo
in dotted access cannot silently resolve to `undefined`. The visual distinction
between "declared property" and "dynamic lookup" is the real benefit.

## Common mistakes

| Mistake | What happens |
|---|---|
| `Translations = Record<string, string>` | One level too few; the nested assertion fails |
| `boolean` in `Config` | Not assignable to the index signature |
| `translations[locale][key]` | Compile error — the first lookup is possibly undefined |
| `if (!message)` | A stored `""` wrongly returns the fallback |
| `for...in` without `hasOwnProperty` | Can pick up inherited keys |
| Casting away `undefined` in `pickDefined` | Compiles, but the values may genuinely be undefined |

## Interview angle

> *"How do you type an object with dynamic keys?"*

Index signature or `Record`, then the important half: turn on
`noUncheckedIndexedAccess`, because otherwise every lookup lies about being
present. Mentioning that unprompted is the part that lands.

> *"When would you use a `Map` instead of a plain object?"*

Arbitrary or user-supplied string keys (prototype pollution), non-string keys,
or when insertion order matters — objects order integer-like keys first. Being
able to name all three shows you have been bitten rather than just read about it.
