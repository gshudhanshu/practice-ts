# 17/03 — The catalogue service

## The architecture in one picture

```
CatalogService.getProduct / listAllProducts
        │
        ▼
catalog.ts  fetchProduct / fetchProducts       ← knows about Products, not caching
        │        (takes ANY TypedClient)
        ▼
service.client       cache  →  retry           ← knows about requests, not Products
        │
        ▼
http.ts  connect / createTypedClient           ← knows about the library
        │
        ▼
legacy-http.ts                                 ← `any`
```

Four layers, each of which knows about exactly one thing. The parsers accept
*a* `TypedClient`, so slipping a decorated one underneath them required no
change to `catalog.ts` at all — and that is the payoff for having defined
`TypedClient` as an interface in 17/01 rather than exporting a concrete class.

## Order matters: cache outside, retry inside

```
#cachedGet → #withRetries → #origin.get
```

Swap them and both of these break:

- **Retry outside cache** — a retried request writes the same response to the
  cache on every attempt, and a cache hit still counts as a request.
- **Cache inside retry** — the first attempt populates the cache, so attempts
  two and three "succeed" instantly by reading the failure they were retrying.

The tests pin the accounting precisely (`hits`, `misses`, `requests`,
`retries`) because those numbers are the only externally visible proof that the
layering is the right way round.

## Only successes are cached

```ts
const response = await this.#withRetries(path, query);
this.#cache.set(key, { response, storedAt: this.#now() });
```

The `set` is *after* the `await`, so a throw skips it. That single line of
sequencing is the whole policy, and it matters more than it looks: caching a
500 with a 30-second TTL converts a two-second upstream blip into a
30-second outage that no amount of retrying by the user can shorten.

Negative caching *is* a real technique — it is how you stop a hot 404 hammering
your database — but it needs its own, much shorter TTL, and it is opt-in.

## Retry only what retrying can fix

```ts
isHttpError(error) && (error.status === 0 || error.status >= 500)
```

| Failure | Retry? | Why |
|---|---|---|
| status 0 (no response) | yes | the socket died; the request may never have arrived |
| 5xx | yes | the server is having a bad time, and might stop |
| 4xx | **no** | you asked for the wrong thing; asking again changes nothing |
| `ValidationError` | **no** | the payload is wrong, and it will be wrong again |

Retrying a 422 three times is three times the load for the same failure. This is
also where 17/01's decision to keep the status on `HttpError` pays off — an
error type that flattened everything to `Error` could not express this policy.

The honest caveat: retrying a non-idempotent request (a `POST` that charges a
card) can double-charge, which is why this client only retries `GET`. In a real
client the retry predicate takes the method into account too.

## Exponential backoff

```ts
await this.#sleep(this.#baseDelayMs * 2 ** (attempt - 1)); // 100, 200, 400
```

Constant-interval retries from every client at once produce a *thundering herd*
— the struggling service gets a synchronised wave of traffic exactly when it can
least cope. Doubling spreads the load out.

Production code adds **jitter** (a random factor, so clients do not re-align)
and a **ceiling** (`Math.min(delay, 30_000)`). Both are one line, and both are
worth mentioning out loud in an interview.

## Injecting the clock and the sleep

```ts
this.#now = options.now ?? Date.now;
this.#sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
```

This is the difference between a test suite that runs in 500ms and one that runs
in four minutes. The TTL test advances a counter by 1000; the backoff test
asserts `delays` is `[100, 200]` without a millisecond passing.

Note the defaults are supplied at construction, not at the call site. The class
is usable as `new CatalogService({ client })` in production and fully
deterministic in tests, with no test-only branch anywhere in the code.

Vitest can fake timers instead, and that is a fine choice. Constructor injection
is the more portable one: it works the same in every runner, needs no
globals-patching, and makes the dependency visible in the type.

## A 404 is an answer, not a failure

```ts
if (isHttpError(error) && error.status === 404) return undefined;
throw error;
```

`getProduct` converts **exactly one** error into a value, and the return type
says so: `Promise<Product | undefined>`. Everything else keeps travelling.

The failure mode to avoid is `catch { return undefined }`, which turns an
upstream outage into "the catalogue is empty" — a silent, plausible,
completely wrong answer. The test that scripts a 500 and expects a rejection
exists purely to catch that.

## Guarding the pagination loop

```ts
if (seen.has(page.nextCursor)) return all;
```

A server that keeps returning the same cursor would otherwise spin for ever. Note
that the cache makes this *worse*, not better: after the first request the loop
would spin without even doing I/O, so there is no network latency to make the
bug visible — just a pegged CPU.

Any "follow the pointer until it is null" loop deserves this guard, and it is
the kind of detail that reads as production experience.

## Common mistakes

| Mistake | What happens |
|---|---|
| Retry wrapping cache | Cache hits count as requests; the stats tests fail |
| Caching failures | The "never caches a failure" test fails |
| Cache key ignoring the query | Page 2 returns page 1 |
| Unsorted query keys | `{a,b}` and `{b,a}` are two entries for one request |
| Retrying 4xx | Three times the load, same failure |
| `catch { return undefined }` in `getProduct` | An outage looks like an empty catalogue |
| Calling `Date.now()` / `setTimeout` directly | The tests can no longer control time |
| `requests` counted per miss rather than per attempt | Retries become invisible |

## Interview angle

> *"How would you add caching and retries to an existing API client?"*

Do not modify the client — wrap it. Show that the consumer depends on an
interface, so a decorator implementing the same interface can be slipped in with
no changes anywhere else. Then get specific, because this is where the answer is
won: cache outside retry, cache successes only, retry only status 0 and 5xx,
exponential backoff with jitter, and a cache key that includes the query with
sorted keys. Finish with the honest limitation — retries on non-idempotent
requests are a correctness bug, not a tuning parameter.

> *"How do you test code that waits?"*

By not waiting. Inject the clock and the delay function, then assert on the
delays that *would* have happened. Fake timers are the alternative; injection is
the version that also documents the dependency in the constructor signature, and
that keeps working when the code moves between runtimes.
