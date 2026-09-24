# 17/03 — CHALLENGE: the catalogue service

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 17 — Working with third-party libraries

---

## Where this fits

The last part of the section-17 project, and it uses both halves:

| File | What it is | Built in |
|---|---|---|
| `legacy-http.ts` | the untyped dependency | given |
| `http.ts` | the typed boundary — `TypedClient`, `HttpError` | 17/01 |
| `catalog.ts` | the validation boundary — `fetchProduct`, `fetchProducts` | 17/02 |

What is missing is everything a service needs around them. Right now every call
hits the library, and every hiccup reaches the user.

The trick is that `fetchProducts` takes **a** `TypedClient`, not **the**
`TypedClient`. So you build a `TypedClient` that caches and retries, and hand
that over instead. The parsers never learn caching exists; the cache never
learns what a `Product` is. That is the decorator from
[06/05](../../06-classes-interfaces/05-implementing-interfaces/), applied to a
network client.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Constructor, options with defaults, the cache, the counters, and `readonly client` — the decorated `TypedClient`. |
| 2 | The retry policy: which failures, how many times, how long between. |
| 3 | The cache: TTL, hit/miss accounting, successes only. |
| 4 | `getProduct(id)` — validated, `undefined` on 404. |
| 5 | `listAllProducts()`, `stats()`, `invalidate(path?)`. |

### The contract the tests pin down

| Option | Default | Meaning |
|---|---|---|
| `now` | `Date.now` | injected clock |
| `sleep` | real `setTimeout` | injected delay |
| `ttlMs` | `30_000` | how long an entry stays fresh |
| `maxAttempts` | `3` | total attempts, the first included |
| `baseDelayMs` | `100` | backoff doubles: 100, 200, 400 |

| Counter | Counts |
|---|---|
| `hits` | `get` calls answered from a live cache entry |
| `misses` | `get` calls that had to ask the client |
| `requests` | calls actually made to the client, **retries included** |
| `retries` | `requests - misses` |

- **Retry** when `isHttpError(error)` and `status === 0 || status >= 500`.
  Never retry a 4xx, and never retry a `ValidationError`.
- **Cache outside retry.** A hit costs zero requests; a request retried twice is
  stored once.
- **Only successes are cached.** Caching a 500 turns a two-second blip into a
  30-second outage.
- **The cache key includes the query, with its keys sorted**, so `{ a, b }` and
  `{ b, a }` are one entry.
- **`invalidate(path)`** drops every key with that prefix; `invalidate()` clears
  the lot.
- **`listAllProducts`** stops if a cursor repeats.

## Rules

- Do not edit `exercise.test.ts`, `catalog.ts`, `http.ts` or `legacy-http.ts`.
- No `any`, no `as`, no `!`.
- Do not call `Date.now()` or `setTimeout` directly — use the injected `now`
  and `sleep`. The tests move time without waiting, and that is the point.
- Do not re-implement parsing. `fetchProduct` and `fetchProducts` already do it;
  give them your decorated client.

## Done when

```bash
npm run check 17/03
```

<details>
<summary>Hint 1 — the decorated client is an object literal</summary>

```ts
this.client = { get: (path, query) => this.#cachedGet(path, query) };
```

That is the entire decorator. It satisfies `TypedClient`, so anything that
accepts a client accepts this — including `fetchProducts`.
</details>

<details>
<summary>Hint 2 — three layers, in this order</summary>

```
#cachedGet   hit? return it. miss? ↓ then store the result
  #withRetries   attempt, and on a retryable failure sleep and go again ↓
    this.#origin.get   the real client
```

Reverse the order and a cache hit still counts a request, or a retried request
gets written to the cache three times.
</details>

<details>
<summary>Hint 3 — the retry loop</summary>

```ts
for (let attempt = 1; ; attempt += 1) {
  this.#requests += 1;
  try {
    return await /* … */;
  } catch (error) {
    const retryable = isHttpError(error) && (error.status === 0 || error.status >= 500);
    if (!retryable || attempt >= this.#maxAttempts) throw error;
    await this.#sleep(this.#baseDelayMs * 2 ** (attempt - 1));
  }
}
```

`2 ** (attempt - 1)` gives 1, 2, 4 — hence 100, 200, 400.
</details>

<details>
<summary>Hint 4 — a stable cache key</summary>

```ts
Object.entries(query)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`)
  .join("&");
```

`Object.entries` gives you `[string, string][]`, which sidesteps
`noUncheckedIndexedAccess` entirely — indexing back into the record would give
you `string | undefined`.
</details>

<details>
<summary>Hint 5 — a 404 is an answer</summary>

```ts
try {
  return await fetchProduct(this.client, id);
} catch (error) {
  if (isHttpError(error) && error.status === 404) return undefined;
  throw error;
}
```

Exactly one error is converted into a value. Everything else — a 500, a
`ValidationError`, a bug in your own code — keeps travelling, because
`getProduct` has no idea how to handle those and pretending it does is how
outages become silent.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

**That completes section 17.** Next:
[section 22 — real-world patterns](../../22-real-world-patterns/).
