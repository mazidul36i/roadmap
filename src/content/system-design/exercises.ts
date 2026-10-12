import type { ExerciseStepId } from "./exerciseMeta";

export interface ExerciseStep {
  /** Questions to answer in this step. */
  prompts: string[];
  /** A strong reference answer, revealed after the learner's attempt. */
  reference: string;
}

export type ExerciseBody = Record<ExerciseStepId, ExerciseStep>;

const urlShortener: ExerciseBody = {
  requirements: {
    prompts: [
      "Which features are core, and which will you leave out?",
      "What's the read:write ratio and the redirect latency target?",
      "Do links expire? Can users pick a custom alias?",
    ],
    reference: `- **Functional:** create a short link (optional custom alias and expiry); \`GET /{code}\` redirects; basic click counts.
- **Out of scope:** editing links, rich analytics dashboards, user management beyond API keys.
- **Non-functional:** redirect p99 under 50 ms; 99.99% available, because a dead link breaks every page that embeds it; reads outnumber writes about 100:1; codes shouldn't be guessable in sequence.`,
  },
  estimates: {
    prompts: ["New links per day, and redirects per second at peak?", "How long must codes be so you never run out?", "Storage after five years?"],
    reference: `- 100 M new links a month ≈ **40 writes/s**; at 100:1 that's ~4,000 redirects/s on average and **~20k/s at peak**.
- Five years ≈ 6 B links. Base62 with 7 characters gives 62⁷ ≈ 3.5 trillion codes: plenty.
- ~500 bytes a row × 6 B ≈ **3 TB**. A modest sharded key-value store holds it, and the hot set fits in cache.`,
  },
  api: {
    prompts: ["Which endpoints, with what requests and responses?", "What's the main table and its key?", "301 or 302 for the redirect, and why?"],
    reference: `\`\`\`
POST /api/links { longUrl, alias?, expiresAt? }  → 201 { code, shortUrl }
GET  /{code}                                     → 302 Location: <longUrl>
\`\`\`
- \`links(code PK, long_url, owner_id, created_at, expires_at)\`. Every read is by \`code\`, so a key-value store (DynamoDB, Cassandra) or Postgres partitioned by code works.
- **302 vs 301:** 302 keeps every click visible (analytics, the ability to disable bad links); 301 lets browsers cache and saves traffic.`,
  },
  design: {
    prompts: ["Walk one redirect request end to end.", "How are codes generated without collisions across many servers?", "Where does caching sit?"],
    reference: `- Client → CDN/edge → load balancer → stateless redirect service → Redis (cache-aside) → key-value store.
- **Code generation:** a counter service hands each app server a block of IDs (say 10k at a time). Encode in base62 and scramble with a bijection so codes aren't sequential. The alternative, a random 7-character code with insert-if-absent and retry, needs no coordinator.
- Click events go onto a queue for an analytics consumer, never onto the redirect path.`,
  },
  deepdive: {
    prompts: ["A celebrity link gets millions of hits a minute. What happens?", "How do expiry and deletion work?", "What breaks if the counter service dies?"],
    reference: `- **Hot keys:** cache at the edge with a short TTL, plus an in-process LRU; Redis read replicas.
- **Expiry:** check \`expires_at\` on read, delete lazily, and sweep periodically. Return 404/410 and cache the miss briefly.
- **Counter outage:** servers keep their pre-allocated blocks, so creation survives for minutes. Run the allocator on replicated storage (a DB sequence, etcd).
- **Abuse:** rate-limit creation per API key; scan targets against malware lists asynchronously.
- **Trade-off out loud:** 302 costs more traffic than 301, and in return you keep analytics and can kill malicious links.`,
  },
};

const rateLimiter: ExerciseBody = {
  requirements: {
    prompts: [
      "What do you limit on (user, key, IP) and how are rules expressed?",
      "What should a client see when it's limited?",
      "If the limiter fails, do you fail open or closed?",
    ],
    reference: `- **Functional:** limit requests per client key per rule (e.g. 100/min per user, 10/s on login); respond 429 with \`Retry-After\`; change rules without deploying.
- **Non-functional:** adds under 2 ms p99; roughly accurate is fine (a few percent over); fail open for most routes, but consider failing closed for login.
- **Out of scope:** billing quotas, network-level DDoS protection.`,
  },
  estimates: {
    prompts: ["Requests per second across the fleet?", "How much counter state, and where can it live?"],
    reference: `- 1 M requests/s across 200 gateway nodes; 50 M active client keys.
- ~100 bytes of state per key → **~5 GB**: fits comfortably in a Redis cluster.
- One counter operation per request → 1 M Redis ops/s → **10 to 20 shards**.`,
  },
  api: {
    prompts: ["What does the gateway call, and what does it get back?", "How are rules stored and distributed?", "What's the counter key?"],
    reference: `- Library or sidecar call: \`allow(clientKey, rule) → { allowed, remaining, resetAt }\`.
- Headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`Retry-After\`.
- Rules: \`{ match: route + method + tier, limit, window, algorithm }\` in a config store, cached in each gateway and pushed on change.
- Counter key: \`rl:{rule}:{clientKey}:{windowStart}\` with a TTL slightly longer than the window.`,
  },
  design: {
    prompts: ["Where does the check run in the request path?", "Which algorithm, and how do you keep check-and-increment atomic?"],
    reference: `- Gateway middleware → local rule cache → Redis cluster sharded by counter key.
- **Algorithm:** a token bucket (allows bursts) or a sliding-window counter (two fixed windows, weighted). Run the logic as a **Lua script** so check-and-increment is atomic in one round trip.
- Config service → pub/sub → gateways reload rules without restarts.`,
  },
  deepdive: {
    prompts: ["How do you keep latency low for very hot keys?", "What happens when Redis is unavailable?", "How do you handle multiple regions?"],
    reference: `- **Hot keys:** local token buckets that sync with Redis every few hundred ms, trading accuracy for latency.
- **Redis down:** fail open with conservative in-memory limits per node, and alert.
- **Races:** never read-then-write; atomic INCR + EXPIRE or Lua.
- **Fixed-window burst:** a fixed window allows 2× the limit across a boundary; a sliding-window counter fixes it cheaply.
- **Multi-region:** per-region limits (limit ÷ regions) are simple and fast; global counters with async replication allow slight overshoot. Say which you'd accept.`,
  },
};

const newsFeed: ExerciseBody = {
  requirements: {
    prompts: ["What's in v1, and what's out?", "How fresh must the feed be?", "How many daily users?"],
    reference: `- **Functional:** create posts, follow and unfollow, a paginated home feed (newest first, ranking later).
- **Non-functional:** feed loads in under 200 ms p99; eventual consistency is fine (a post may take seconds to appear); 300 M daily users.
- **Out of scope:** ads, search, direct messages.`,
  },
  estimates: {
    prompts: ["Feed reads per second at peak?", "Posts per second, and the fan-out cost?", "What do celebrities do to your numbers?"],
    reference: `- 300 M DAU × 10 feed opens ≈ 3 B reads/day ≈ **35k/s average, ~100k/s peak**.
- 60 M posts/day ≈ 700/s. With 200 followers on average, naive fan-out means 12 B timeline inserts a day (~140k/s).
- An account with 50 M followers makes pure fan-on-write infeasible: one post = 50 M writes.`,
  },
  api: {
    prompts: ["Which endpoints?", "How do you paginate?", "What are the main stores and their keys?"],
    reference: `\`\`\`
POST /posts { text, mediaIds }
GET  /feed?cursor=<postId>&limit=20 → { items, nextCursor }
POST /users/{id}/follow
\`\`\`
- \`posts(post_id, author_id, body, created_at)\`: time-sortable IDs (Snowflake-style), sharded by author.
- \`follows(follower_id, followee_id)\`, indexed both ways.
- Timeline cache: a Redis list of post IDs per user, capped around 800.
- **Cursor pagination** by post ID, never offsets.`,
  },
  design: {
    prompts: ["Walk the write path.", "Walk the read path."],
    reference: `- **Write:** post service → posts DB → event on a queue → fan-out workers push the post ID into each follower's timeline list.
- **Read:** feed service reads the user's timeline IDs → hydrates posts from a post cache → (optionally) ranks → returns a page.
- Media goes to object storage behind a CDN; only IDs travel through the feed.`,
  },
  deepdive: {
    prompts: ["How do you handle celebrities?", "What about inactive users and deleted posts?", "Push vs pull: what does each cost?"],
    reference: `- **Hybrid fan-out:** push for ordinary accounts; pull for celebrities, merging their recent posts at read time.
- **Inactive users:** skip fan-out for users idle 30+ days and rebuild their timeline when they return.
- **Deletes:** tombstone the post and filter at hydration.
- **Trade-off:** push costs write amplification and cache memory but makes reads cheap; pull costs read latency. The hybrid takes each where it's cheapest.`,
  },
};

const typeahead: ExerciseBody = {
  requirements: {
    prompts: ["What exactly is returned per keystroke?", "How quickly must trends show up?", "What's the latency budget?"],
    reference: `- **Functional:** top 10 completions for a prefix, ranked by popularity (optionally personalised), light typo tolerance.
- **Non-functional:** p99 under 50 ms (it runs per keystroke); trending terms appear within an hour; huge read volume.
- **Out of scope:** the search results page itself.`,
  },
  estimates: {
    prompts: ["Requests per second at peak?", "How big is the serving index?"],
    reference: `- 50 M DAU × 5 searches × ~6 keystrokes ≈ 1.5 B requests/day ≈ **17k/s average, 60k/s peak** (client debouncing cuts this).
- ~100 M unique queries. Storing the top 10 for prefixes up to 20 characters fits in memory per node, or in a few shards.`,
  },
  api: {
    prompts: ["What does the endpoint look like?", "What data do you aggregate, and what do you serve from?"],
    reference: `\`\`\`
GET /suggest?q=iph&limit=10&locale=en → [{ text, score }]
\`\`\`
- Aggregated counts: \`(query, count, window)\` with time decay.
- Serving structure: prefix → precomputed top-K list (or a trie with top-K stored at each node).`,
  },
  design: {
    prompts: ["What's built offline versus served online?", "Walk one keystroke end to end."],
    reference: `- **Offline:** query logs → Kafka → stream/batch aggregation with decay → build the prefix index → publish a snapshot to serving nodes every few minutes.
- **Online:** client debounces 100–150 ms → edge cache for short popular prefixes → suggest service (in-memory index) → optional personal re-rank.`,
  },
  deepdive: {
    prompts: ["How do you keep memory under control?", "How do trending terms appear quickly?", "How do you stop offensive suggestions?"],
    reference: `- **Memory:** store top-K only for prefixes up to length L; shard by leading characters if needed.
- **Freshness:** a small trending overlay updated every few minutes, merged at query time.
- **Safety:** a blocklist applied at build time, plus a fast kill switch.
- **Typos:** fall back to edit distance 1 only when exact-prefix results are thin.
- **Caching:** prefixes of length 1 to 3 dominate traffic, so cache them at the edge with a short TTL.`,
  },
};

const notifications: ExerciseBody = {
  requirements: {
    prompts: ["Who calls this service and with what?", "Which guarantees matter most?", "How do different priorities coexist?"],
    reference: `- **Functional:** an API for other services (template, user, channels); user preferences and opt-outs; scheduling; retries; delivery status.
- **Non-functional:** at-least-once with de-duplication (no double SMS); one-time codes within seconds while marketing can wait; 50k/s campaign peaks; survive provider outages.`,
  },
  estimates: {
    prompts: ["Average and peak sends per second?", "How much status data, and for how long?"],
    reference: `- 1 B notifications/day ≈ **12k/s average, 50k/s peak** during campaigns; ~5% are transactional and latency-critical.
- Status log ≈ 300 GB/day: keep 30 days hot, archive the rest.`,
  },
  api: {
    prompts: ["What does a send request contain?", "What makes it idempotent?", "Which tables?"],
    reference: `\`\`\`
POST /notifications { idempotencyKey, userId, template, params, channels?, priority, sendAt? }
     → 202 { notificationId }
GET  /notifications/{id}
PUT  /users/{id}/preferences
\`\`\`
- Tables: \`notifications\` (unique \`idempotency_key\`, status), \`preferences\`, \`templates\`, \`delivery_attempts\`.`,
  },
  design: {
    prompts: ["Walk one notification from API call to the user's phone.", "How do scheduled sends work?"],
    reference: `- API → validate and de-duplicate on the idempotency key → persist → publish to a priority topic (\`transactional\`, \`bulk\`).
- Channel workers: check preferences, quiet hours and frequency caps → render the template → call the provider (APNs/FCM, email, SMS) → record the attempt.
- A scheduler moves due \`sendAt\` items onto the queue; provider webhooks update delivery status.`,
  },
  deepdive: {
    prompts: ["How do you stop a campaign delaying password-reset codes?", "Retries without duplicates?", "A provider goes down. Now what?"],
    reference: `- **Isolation:** separate topics and worker pools per priority.
- **Retries:** exponential backoff with jitter, a dead-letter queue after N attempts, and the idempotency key passed to providers that support it.
- **Provider outage:** circuit breaker plus failover to a secondary provider.
- **Spam control:** per-user frequency caps and a de-duplication window.
- **Observability:** send, deliver and fail rates per channel; alert on queue lag.`,
  },
};

const chat: ExerciseBody = {
  requirements: {
    prompts: ["Which chat features are core?", "Delivery and ordering guarantees?", "What happens when a user is offline?"],
    reference: `- **Functional:** 1:1 and group chats (up to 256), delivery and read receipts, presence, history on a new device, delivery when the recipient comes back online.
- **Non-functional:** under 500 ms delivery when both are online; messages are never lost; ordering within a conversation; 100 M DAU.
- **Out of scope:** calls; mention end-to-end encryption but don't design it.`,
  },
  estimates: {
    prompts: ["Messages per second?", "Concurrent connections and gateway count?", "Storage per year?"],
    reference: `- 100 M DAU × 40 messages ≈ 4 B/day ≈ **46k/s average, ~150k/s peak**.
- ~30 M concurrent WebSockets; at ~50k per gateway node that's **~600 nodes**.
- 4 B × 200 bytes ≈ 800 GB/day ≈ **300 TB/year**.`,
  },
  api: {
    prompts: ["What flows over the socket?", "How does a client fetch history?", "How are messages stored?"],
    reference: `\`\`\`
→ send    { clientMsgId, conversationId, body }
← ack     { clientMsgId, serverMsgId, seq }
← message { conversationId, seq, senderId, body, sentAt }
→ receipt { conversationId, upToSeq, type: delivered | read }
GET /conversations/{id}/messages?beforeSeq=…
\`\`\`
- \`messages\` partitioned by \`conversation_id\`, clustered by \`seq\` (Cassandra/Scylla); membership tables; per-user last-delivered seq per conversation.`,
  },
  design: {
    prompts: ["Walk a message from sender to an online recipient.", "And to an offline one?"],
    reference: `- Clients hold a WebSocket to a gateway behind an L4 load balancer. A session registry (Redis) maps user → gateway node.
- **Send:** gateway → chat service assigns the next per-conversation \`seq\`, persists, acks the sender → looks up recipients' gateways → pushes over internal pub/sub.
- **Offline:** push notification; on reconnect the client sends its last \`seq\` per conversation and the server sends the gap.`,
  },
  deepdive: {
    prompts: ["How do you guarantee per-conversation order?", "How do you avoid duplicates?", "What happens when a gateway dies?"],
    reference: `- **Ordering:** one writer per conversation (partition ownership) or a conditional write assigns monotonic \`seq\`.
- **Duplicates:** at-least-once delivery + \`clientMsgId\` de-duplication on the server + client-side de-dup by \`seq\`.
- **Groups:** write once, fan out delivery; large groups go through a queue.
- **Gateway failure:** clients reconnect elsewhere and resync from their last \`seq\`; registry entries expire via heartbeats.
- **Presence:** heartbeats with TTLs, shared lazily with open chats only, to avoid presence storms.`,
  },
};

const paymentsLedger: ExerciseBody = {
  requirements: {
    prompts: ["What money movements are in scope?", "Which matters more here: availability or correctness?", "What does audit require?"],
    reference: `- **Functional:** accounts, internal transfers, top-ups and withdrawals via an external provider, balance and statement views.
- **Non-functional:** correctness over availability (never lose or double money); full audit trail; idempotent APIs; 5k transfers/s at peak; balance reads under 100 ms.
- **Out of scope:** fraud models, currency exchange.`,
  },
  estimates: {
    prompts: ["Transfers per second?", "How many ledger rows, and for how long?"],
    reference: `- 50 M transfers/day ≈ 600/s average, **5k/s peak**.
- Two ledger entries per transfer → 100 M rows/day ≈ 20 GB/day. Retained for years (regulation), so partition by time and account.`,
  },
  api: {
    prompts: ["What does a transfer request look like?", "How do you model money and history?"],
    reference: `\`\`\`
POST /transfers { idempotencyKey, fromAccount, toAccount, amount, currency } → { transferId, status }
GET  /accounts/{id}/balance
GET  /accounts/{id}/entries?cursor=…
\`\`\`
- **Double-entry:** \`ledger_entries(entry_id, transfer_id, account_id, amount ±, created_at)\`, immutable and append-only.
- \`accounts(id, balance, version)\`, \`transfers(id, idempotency_key UNIQUE, status)\`.
- Amounts are integers in minor units, never floating point.`,
  },
  design: {
    prompts: ["Walk an internal transfer.", "How do external top-ups fit in?", "How do other systems hear about transfers?"],
    reference: `- **One DB transaction:** insert the transfer (unique key) → lock both accounts in a fixed order (avoids deadlocks) → check funds → insert two entries → update balances → commit.
- **Outbox:** write an event row in the same transaction; a relay publishes it to Kafka for notifications and analytics.
- **External money:** a \`pending → settled\` state machine driven by provider webhooks, with a daily reconciliation against provider reports.`,
  },
  deepdive: {
    prompts: [
      "Why a relational database, and what happens when you shard?",
      "A merchant account is extremely hot. Now what?",
      "How do you prove the books balance?",
    ],
    reference: `- **Relational:** multi-row ACID transactions are the point. Shard by account only when needed; cross-shard transfers then need a saga (debit, credit, compensations) or a coordinator.
- **Idempotency:** a unique key plus the stored response, so retries return the original result.
- **Hot accounts:** split into sub-account buckets and sum them on read.
- **Audit:** never update entries; corrections are new reversing entries.
- **Invariants checked continuously:** entries per transfer sum to zero; balance equals the sum of entries.`,
  },
};

const jobScheduler: ExerciseBody = {
  requirements: {
    prompts: ["One-off, recurring, or both?", "What does 'reliable' mean here?", "What load shape do you expect?"],
    reference: `- **Functional:** one-off jobs at a time, recurring cron jobs, retry policies, cancellation, run history.
- **Non-functional:** at-least-once execution, start within seconds of schedule, no single point of failure, 10 M jobs/day with spikes on the hour.
- **Out of scope:** DAG workflows (mention as an extension).`,
  },
  estimates: {
    prompts: ["Average and burst jobs per second?", "How much metadata?"],
    reference: `- 10 M/day ≈ 115/s average, but cron clusters on the hour: ~1 M jobs in the midnight minute ≈ **17k/s bursts**.
- ~1 KB of metadata × 10 M active jobs ≈ 10 GB.`,
  },
  api: {
    prompts: ["How is a job submitted?", "Which tables and indexes?"],
    reference: `\`\`\`
POST   /jobs { idempotencyKey, schedule: cron | runAt, handler, payload, retryPolicy, timeout }
DELETE /jobs/{id}
GET    /jobs/{id}/runs
\`\`\`
- \`jobs(id, schedule, next_run_at, status, …)\` indexed on \`next_run_at\`; \`job_runs(job_id, run_id, attempt, status, worker, started_at)\`.`,
  },
  design: {
    prompts: ["How do schedulers find due jobs without stepping on each other?", "How do runs reach workers?"],
    reference: `- The jobs table is split into partitions; scheduler nodes **lease** partitions (etcd/ZooKeeper).
- Each scheduler polls \`next_run_at <= now + lookahead\` for its partitions, enqueues runs (Kafka/SQS), and advances \`next_run_at\` in the same transaction.
- Workers pull runs, execute with a timeout, heartbeat, and record results. Failures retry with backoff, then go to a dead-letter queue.`,
  },
  deepdive: {
    prompts: ["How do you avoid running a job twice?", "A scheduler node dies. What happens?", "How do you survive the top-of-the-hour spike?"],
    reference: `- **Duplicates:** at-least-once delivery + run IDs + idempotent handlers; de-duplicate on \`(job_id, scheduled_time)\`.
- **Failover:** leases expire and another node takes the partition; the lookahead window covers the gap.
- **Thundering herd:** jitter flexible jobs, pre-enqueue with delivery delays, autoscale workers on queue depth.
- **Long jobs:** heartbeats; reassign when they stop (accepting a possible duplicate, which idempotency absorbs).
- **Observability:** schedule lag (actual minus planned start), queue depth, failure rate per handler.`,
  },
};

const BODIES: Record<string, ExerciseBody> = {
  "url-shortener": urlShortener,
  "rate-limiter": rateLimiter,
  "news-feed": newsFeed,
  typeahead,
  notifications,
  chat,
  "payments-ledger": paymentsLedger,
  "job-scheduler": jobScheduler,
};

export default BODIES;
