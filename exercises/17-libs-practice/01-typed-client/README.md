# 17/01 — A typed client over an untyped library

**Tier:** Core · **Time:** ~30 min · **Course section:** 17 — Working with third-party libraries

---

## The situation

`legacy-http.ts` is in this directory. Read the top of it, then look at a
signature:

```ts
export function createClient(options: any): any;
```

That is a real dependency you cannot fix: no types, no `@types/` package worth
having, and a maintainer who last published in 2019. It resolves with
`{ statusCode, payload, headers }`, rejects with a *plain object* for 4xx/5xx,
and rejects with a *bare string* when the socket dies.

Left alone, that `any` spreads. `client.reqeust("GET", "/x")` compiles.
`response.payload.items.map(...)` compiles. Every one of them is a runtime
crash the compiler could have caught.

The fix is not to type the library. It is to **wrap it**: one small module that
is allowed to touch it, whose exports are honest. This is the boundary the rest
of section 17 builds on.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `LegacyRequestOptions`, `LegacyClient`, `HttpResponse` — the surface you use, and the shape you hand out. |
| 2 | `HttpError` (`status`, `path`, `message`, `name`) and the `isHttpError` predicate. |
| 3 | `toHttpResponse(raw, path)` — narrow a resolved value, or throw a 502. |
| 4 | `toHttpError(reason, path)` — one error type from four rejection shapes. |
| 5 | `TypedClient`, `createTypedClient`, `connect` — the boundary itself. |

### Details the tests pin down

- **`HttpResponse["body"]` must be `unknown`, not `any`.** There is a
  compile-time assertion for exactly this, because `any` here would defeat the
  whole exercise.
- **`toHttpResponse`** accepts a missing `payload` (a 204 has no body) but
  rejects `null`, arrays, strings, and a non-numeric `statusCode`, all with
  `HttpError(502, path, "malformed response")`.
- **`toHttpError`** returns an existing `HttpError` unchanged, and uses
  **status 0** for "there was never a response" — a string rejection or a real
  `Error`.
- **`createTypedClient.get`** throws `HttpError(status, path, \`request failed
  with status ${status}\`)` if a status ≥ 400 arrives *resolved*.
- **`connect`** is the only function that may mention `createClient`.

## Rules

- Do not edit `exercise.test.ts` or `legacy-http.ts`.
- No `any`, no `as`, no `!` — including in `toHttpResponse`, which is solvable
  with `typeof` plus the `in` operator.
- The boundary leaks nothing: no caller should ever see `statusCode`, `payload`,
  or a rejection that is not an `HttpError`.

## Done when

```bash
npm run check 17/01
```

<details>
<summary>Hint 1 — declare only what you use</summary>

You are not writing a `.d.ts` for the library. You are writing the contract
*your* code depends on:

```ts
export type LegacyClient = {
  request(
    method: string,
    path: string,
    options?: LegacyRequestOptions,
  ): Promise<unknown>;
};
```

The library returns `any`, and `any` is assignable to `unknown`, so this
declaration fits without a single cast — while stopping the `any` dead.
</details>

<details>
<summary>Hint 2 — reading a property off <code>unknown</code> without a cast</summary>

```ts
if (typeof raw !== "object" || raw === null || Array.isArray(raw)) { /* … */ }
if (!("statusCode" in raw)) { /* … */ }
const status: unknown = raw.statusCode; // no cast needed
```

The `in` operator narrows an `object` to one that *has* that key, and the
property reads as `unknown`. Remember `typeof null === "object"`, and that
arrays are objects too.
</details>

<details>
<summary>Hint 3 — <code>toHttpError</code> in order</summary>

Check from most specific to least: already an `HttpError` → a `string` → an
`Error` → an object with a numeric `statusCode` → give up with status 0. The
order matters, because an `HttpError` *is* an `Error` and would otherwise lose
its status.
</details>

<details>
<summary>Hint 4 — <code>exactOptionalPropertyTypes</code> bites here</summary>

```ts
legacy.request("GET", path, { query }); // ✘ when query is undefined
```

`query?: Readonly<Record<string, string>>` may not hold an explicit
`undefined` (03/03). Build the options object conditionally instead:

```ts
query === undefined ? {} : { query }
```
</details>

<details>
<summary>Hint 5 — where the <code>any</code> dies</summary>

```ts
const legacy: LegacyClient = createClient({ baseUrl, flakyTimes });
```

One annotated variable. Everything downstream of it is typed, and if the
library's real shape ever drifts from your declaration, this is the single line
you have to revisit.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

Next: [17/02 — the validation boundary](../02-runtime-validation-boundary/),
which turns that `unknown` body into a real domain type.
