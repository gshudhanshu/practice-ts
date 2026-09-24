# 17/02 — The runtime validation boundary

**Tier:** Core · **Time:** ~30 min · **Course section:** 17 — Working with third-party libraries

---

## Where this fits

Part 2 of the section-17 project. `http.ts` is the client you built in 17/01,
provided here so this stands alone. It hands you an `HttpResponse` whose `body`
is `unknown` — the envelope is verified, the payload is not.

The temptation is one line:

```ts
const page = response.body as ProductPage; // ✘
```

That compiles, and it is wrong twice over. The wire sends `title` and
`price_cents`; your domain wants `name` and `priceCents`. A cast tells the
compiler a thing you have not checked and, in this case, a thing that is not
even true.

**Only code that looks at the value at runtime can turn `unknown` into
`Product`.** This exercise builds that code — six small parsers that compose,
each of which returns the type it promises or throws with the exact path that
failed. It is a hand-rolled Zod, and writing one is the fastest way to
understand what Zod is doing for you.

## Your task

Open `exercise.ts` and resolve all five TODOs. `ValidationError`, `Parser<T>`
and `assertIsRecord` are given — `assertIsRecord` is the assertion function
from [07/05](../../07-advanced-types/05-assertion-functions/), here to be
*applied*, not rewritten.

| # | Requirement |
|---|---|
| 1 | `asString`, `asInteger`, `asBoolean` — the leaves. |
| 2 | `arrayOf(item)` — the first combinator, with `path[index]` errors. |
| 3 | `withDefault(inner, fallback)` and `nullable(inner)`. |
| 4 | `parseProduct` — validate **and rename** the wire shape. |
| 5 | `parseProductPage`, `fetchProducts`, `fetchProduct`. |

### The two shapes

| Wire (what `legacy-http` sends) | Domain (what your app uses) |
|---|---|
| `{ id, title, price_cents, tags, discontinued? }` | `{ id, name, priceCents, tags, discontinued }` |
| `{ items, next_cursor }` (may be absent) | `{ items, nextCursor: string \| null }` |

### Error messages the tests pin down

| Situation | Message |
|---|---|
| Wrong leaf type | `<path>: expected a string` / `an integer` / `a boolean` |
| Not an array | `<path>: expected an array` |
| Bad element | `tags[1]: expected a string` |
| Not an object | `<path>: expected an object` |
| Nested | `body.items[1].title: expected a string` |

Paths use the **wire** field name (`price_cents`), because that is what the
person reading the log is looking at.

## Rules

- Do not edit `exercise.test.ts`, `http.ts` or `legacy-http.ts`.
- No `any`, no `as`, no `!`. A cast here would defeat the entire exercise.
- `asInteger` accepts only a `number` that `Number.isInteger` approves of —
  `1.5`, `NaN`, `Infinity` and `"5"` all fail.
- `withDefault` replaces **`undefined` only**; `nullable` allows **`null`
  only**. They are different questions and the tests check both.
- The fetch functions catch nothing. An `HttpError` and a `ValidationError`
  mean different things and both deserve to reach the caller.

## Done when

```bash
npm run check 17/02
```

<details>
<summary>Hint 1 — the annotation does the typing</summary>

```ts
export const asString: Parser<string> = (value, path) => { … };
```

`Parser<string>` is `(value: unknown, path: string) => string`, so `value` and
`path` are contextually typed and the compiler checks that every path out of the
function really produces a `string`. No parameter annotations needed.
</details>

<details>
<summary>Hint 2 — a combinator returns a parser</summary>

```ts
export function arrayOf<T>(item: Parser<T>): Parser<readonly T[]> {
  return (value, path) => { … };
}
```

Inside, `Array.isArray(value)` narrows, and `value.map((element, index) =>
item(element, `${path}[${index}]`))` is the whole body. The mapped result is a
`T[]` precisely *because* every element went through `item`.
</details>

<details>
<summary>Hint 3 — the assertion function flattens the pyramid</summary>

```ts
assertIsRecord(value, path);
return { id: asString(value["id"], `${path}.id`), … };
```

The narrowing survives for the rest of the scope (07/05), so `parseProduct` is
one assertion followed by a flat object literal — no nesting, no casts.
</details>

<details>
<summary>Hint 4 — combinators stack</summary>

`next_cursor` may be a string, an explicit `null`, or missing entirely:

```ts
withDefault(nullable(asString), null)
```

Read it inside-out: a string, or null, or — if the key is absent — the default.
</details>

<details>
<summary>Hint 5 — where the renaming lives</summary>

In `parseProduct`, and nowhere else. The key on the left is your domain name,
the string on the right is the wire name:

```ts
name: asString(value["title"], `${path}.title`),
```

Past this function, no code in the application has ever heard of `title`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

Next: [17/03 — the integration challenge](../03-integration/), which puts the
client and the parsers behind a caching, retrying service.
