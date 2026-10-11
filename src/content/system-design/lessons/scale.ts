import type { LessonBody } from "@content/types";

export const sdLoadBalancing: LessonBody = {
  id: "sd-load-balancing",
  blocks: [
    {
      type: "md",
      md: `A load balancer spreads traffic across identical, **stateless** servers so you can add capacity by adding boxes and survive when one dies. A CDN does the same for static and cacheable content, but at the network edge, close to users.`,
    },
    {
      type: "compare",
      title: "L4 vs L7",
      headers: ["Layer", "Sees", "Can do", "Examples"],
      rows: [
        ["L4 (transport)", "IP and port", "Very fast, protocol-agnostic forwarding", "AWS NLB, HAProxy (TCP mode)"],
        ["L7 (application)", "HTTP paths, headers, cookies", "Path routing, TLS termination, retries, auth", "AWS ALB, Nginx, Envoy"],
      ],
    },
    {
      type: "compare",
      title: "Balancing algorithms",
      headers: ["Algorithm", "When"],
      rows: [
        ["Round robin", "Uniform, short requests"],
        ["Least connections", "Requests of very different duration"],
        ["Consistent hashing", "Sticky routing for cache locality"],
        ["Weighted", "Mixed instance sizes or canaries"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Keep servers stateless",
      md: "Move sessions to Redis or tokens (JWT), files to object storage. Then any server can handle any request, and autoscaling and failover just work.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "CDN basics",
      md: "Cache static assets and cacheable API responses at the edge with `Cache-Control`. Version asset URLs (`app.3f2a.js`) so you can cache them for a year and still deploy instantly.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "The load balancer as a single point of failure (run it redundantly)",
        "Health checks that only test 'process is up', not 'can serve'",
        "Sticky sessions hiding state that breaks failover",
        "Forgetting TLS termination and where certificates live",
      ],
    },
    { type: "quiz", ids: ["sdlb-q1", "sdlb-q2"] },
  ],
  quiz: [
    {
      id: "sdlb-q1",
      prompt: "You need to route /api/* and /images/* to different services. Which balancer?",
      choices: ["L4", "L7", "DNS round robin", "None needed"],
      answer: 1,
      explanation: "Path-based routing needs to read HTTP, which is layer 7.",
    },
    {
      id: "sdlb-q2",
      prompt: "Requests vary from 5 ms to 5 s. Best algorithm?",
      choices: ["Round robin", "Least connections", "Random", "IP hash"],
      answer: 1,
      explanation: "Least connections avoids piling more work on servers busy with slow requests.",
    },
  ],
  cards: [
    { id: "sdlb-c1", front: "L4 vs L7 load balancing?", back: "L4 forwards by IP/port (fast, simple). L7 understands HTTP (path routing, TLS, retries)." },
    { id: "sdlb-c2", front: "Why stateless app servers?", back: "Any server can serve any request, so scaling out and failover are trivial." },
    { id: "sdlb-c3", front: "How to cache assets forever yet deploy instantly?", back: "Content-hashed filenames + long Cache-Control max-age." },
  ],
};

export const sdQueues: LessonBody = {
  id: "sd-queues",
  blocks: [
    {
      type: "md",
      md: `Asynchronous messaging decouples **who asks** from **who does the work**. The producer returns fast; consumers process at their own pace, retry on failure, and scale independently. It's how you absorb spikes and keep slow work out of the request path.`,
    },
    {
      type: "compare",
      title: "Queue vs log",
      headers: ["", "Message queue (SQS, RabbitMQ)", "Event log (Kafka)"],
      rows: [
        ["Model", "Message consumed and deleted", "Append-only log, consumers track offsets"],
        ["Replay", "No", "Yes, rewind to any offset within retention"],
        ["Ordering", "Usually none (FIFO queues: limited)", "Per partition"],
        ["Fan-out", "One consumer per message (or extra queues)", "Many independent consumer groups"],
        ["Best for", "Task/work distribution", "Event streams, CDC, analytics, many readers"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Kafka consumer with manual commit (at-least-once)",
      code: `@KafkaListener(topics = "orders", groupId = "billing")
public void onOrder(ConsumerRecord<String, Order> record, Acknowledgment ack) {
    billing.charge(record.value());   // must be idempotent: redelivery can happen
    ack.acknowledge();                // commit the offset only after the work succeeds
}`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Ordering lives in the partition key",
      md: "Kafka only orders messages within a partition. Key by the entity whose events must stay ordered (orderId, userId) and all its events land in the same partition, in order.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "Poison messages",
      md: "Retry with backoff a few times, then move the message to a **dead-letter queue** and alert. Never let one bad message block a partition forever.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Committing the offset before processing (data loss on crash)",
        "Non-idempotent consumers with at-least-once delivery",
        "Too few partitions to scale consumers (consumers per group ≤ partitions)",
        "Using a queue where the caller actually needs a synchronous answer",
      ],
    },
    { type: "quiz", ids: ["sdq-q1", "sdq-q2", "sdq-q3"] },
  ],
  quiz: [
    {
      id: "sdq-q1",
      prompt: "Three services must each react to every 'OrderPlaced' event, and you may need to replay last week's events. Pick…",
      choices: ["One SQS queue", "Kafka topic with three consumer groups", "Synchronous REST calls", "A shared database table"],
      answer: 1,
      explanation: "Independent consumer groups each read the full stream; retention allows replay.",
    },
    {
      id: "sdq-q2",
      prompt: "Events for the same order must be processed in order. What do you key messages by?",
      choices: ["Random UUID", "orderId", "Timestamp", "Consumer id"],
      answer: 1,
      explanation: "Same key → same partition → preserved order.",
    },
    {
      id: "sdq-q3",
      prompt: "A consumer group has 12 consumers but the topic has 4 partitions. What happens?",
      choices: ["All 12 share the work", "Only 4 consumers get partitions; 8 sit idle", "Kafka creates 8 partitions", "Messages are duplicated"],
      answer: 1,
      explanation: "Each partition is assigned to at most one consumer in a group.",
    },
  ],
  cards: [
    {
      id: "sdq-c1",
      front: "Queue vs Kafka log?",
      back: "Queue: consume-and-delete, work distribution. Log: retained, replayable, many consumer groups, per-partition order.",
    },
    {
      id: "sdq-c2",
      front: "At-least-once with Kafka requires what from consumers?",
      back: "Idempotent processing, and committing offsets only after success.",
    },
    { id: "sdq-c3", front: "How is ordering preserved in Kafka?", back: "Within a partition; choose the message key = entity needing order." },
    { id: "sdq-c4", front: "Dead-letter queue purpose?", back: "Park messages that keep failing after retries so they don't block the stream." },
    { id: "sdq-c5", front: "Max useful consumers in a group?", back: "Equal to the number of partitions." },
  ],
};

export const sdRateLimiting: LessonBody = {
  id: "sd-rate-limiting",
  blocks: [
    {
      type: "md",
      md: `Rate limiting protects a service from abuse and from itself: noisy neighbours, retry storms, scrapers. Decide **who** is limited (user, API key, IP), **how much** (100 requests/minute), and **what happens** at the limit (HTTP 429 with \`Retry-After\`).`,
    },
    {
      type: "compare",
      title: "Algorithms",
      headers: ["Algorithm", "Behaviour", "Trade-off"],
      rows: [
        ["Token bucket", "Tokens refill at rate r up to capacity b; each request spends one", "Allows bursts up to b; the usual choice"],
        ["Leaky bucket", "Requests drain at a fixed rate", "Smooths output; no bursts"],
        ["Fixed window counter", "Count per minute bucket", "Spikes at window edges (2× burst)"],
        ["Sliding window log/counter", "Weights the previous window", "Accurate; a bit more memory"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Token bucket",
      code: `final class TokenBucket {
    private final double capacity, refillPerSecond;
    private double tokens;
    private long lastNanos = System.nanoTime();

    TokenBucket(double capacity, double refillPerSecond) {
        this.capacity = capacity; this.refillPerSecond = refillPerSecond; this.tokens = capacity;
    }

    synchronized boolean tryAcquire() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - lastNanos) / 1e9 * refillPerSecond);
        lastNanos = now;
        if (tokens < 1) return false;   // caller responds 429 Too Many Requests
        tokens -= 1;
        return true;
    }
}`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Distributed limits",
      md: "With many servers, keep counters in Redis and update them atomically (a Lua script or `INCR` + `EXPIRE`). For extreme scale, give each node a local share of the budget and sync periodically, accepting slight over-admission.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Per-server limits that multiply as you scale out",
        "Non-atomic read-then-write counters in Redis",
        "No `Retry-After`, so clients retry immediately",
        "Limiting by IP behind a corporate NAT and blocking a whole office",
      ],
    },
    { type: "quiz", ids: ["sdrl-q1", "sdrl-q2"] },
  ],
  quiz: [
    {
      id: "sdrl-q1",
      prompt: "Which algorithm allows short bursts while enforcing an average rate?",
      choices: ["Leaky bucket", "Token bucket", "Fixed window", "None"],
      answer: 1,
      explanation: "A full bucket can be spent at once (a burst), then refills at the steady rate.",
    },
    {
      id: "sdrl-q2",
      prompt: "What's the flaw of a fixed-window counter?",
      choices: ["Too much memory", "Up to 2× the limit at window boundaries", "Can't use Redis", "Needs a database"],
      answer: 1,
      explanation: "A client can use the full quota at 0:59 and again at 1:00.",
    },
  ],
  cards: [
    { id: "sdrl-c1", front: "Token bucket in one sentence?", back: "Tokens refill at rate r up to capacity b; each request spends one; empty → 429." },
    { id: "sdrl-c2", front: "Fixed window problem?", back: "Boundary bursts: up to 2× the limit across two adjacent windows." },
    {
      id: "sdrl-c3",
      front: "Rate limiting across many servers?",
      back: "Shared atomic counters (Redis Lua/INCR+EXPIRE), or local budgets synced periodically.",
    },
    { id: "sdrl-c4", front: "Correct response when limited?", back: "HTTP 429 with a Retry-After header." },
  ],
};

export const sdIdempotency: LessonBody = {
  id: "sd-idempotency",
  blocks: [
    {
      type: "md",
      md: `Networks fail in the worst way: **you can't tell whether a request failed or only its response did**. So clients retry, and every write path must survive seeing the same request twice.

That's why "exactly-once delivery" is a myth across a network. What you *can* build is **exactly-once effect**: at-least-once delivery plus idempotent processing.`,
    },
    {
      type: "steps",
      title: "Making effects exactly-once",
      items: [
        { title: "Give every operation an identity", md: "An idempotency key from the client, or a natural key (orderId + step)." },
        {
          title: "Record it atomically with the effect",
          md: "Insert the key into a `processed` table in the **same transaction** as the write; a unique constraint rejects duplicates.",
        },
        { title: "Return the original result for repeats", md: "Store the response so a retry gets the same answer, not an error." },
        { title: "Retry safely", md: "Exponential backoff with jitter, a retry budget, and only for retryable errors (timeouts, 503, 429)." },
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Idempotent consumer with a unique constraint",
      code: `@Transactional
public void handle(PaymentEvent event) {
    try {
        processedEvents.insert(event.id());          // UNIQUE(event_id)
    } catch (DuplicateKeyException alreadyDone) {
        return;                                      // seen before: no second effect
    }
    ledger.credit(event.accountId(), event.amount()); // same transaction as the insert
}`,
    },
    {
      type: "callout",
      tone: "tip",
      title: "The outbox pattern",
      md: "To update a database *and* publish an event without losing either, write the event to an `outbox` table in the same transaction, and have a relay (or CDC like Debezium) publish it. No dual-write inconsistencies.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Retrying non-idempotent POSTs blindly",
        "Retries without jitter causing synchronized storms",
        "Checking 'already processed?' and writing the effect in separate transactions",
        "Writing to the DB and Kafka separately (dual write)",
      ],
    },
    { type: "quiz", ids: ["sdi-q1", "sdi-q2"] },
  ],
  quiz: [
    {
      id: "sdi-q1",
      prompt: "Why is exactly-once delivery impossible over an unreliable network?",
      choices: [
        "TCP drops packets",
        "A sender can't distinguish a lost request from a lost acknowledgement, so it must retry or risk loss",
        "Kafka doesn't support it",
        "Clocks drift",
      ],
      answer: 1,
      explanation: "Without knowing, you choose at-most-once (may lose) or at-least-once (may duplicate). Idempotency makes duplicates harmless.",
    },
    {
      id: "sdi-q2",
      prompt: "How do you update a DB and publish an event without dual-write bugs?",
      choices: ["Publish first, then write", "Transactional outbox", "Two-phase commit with Kafka", "Retry until both succeed"],
      answer: 1,
      explanation: "The event row commits atomically with the data; a relay publishes it afterwards.",
    },
  ],
  cards: [
    { id: "sdi-c1", front: "Exactly-once effect = ?", back: "At-least-once delivery + idempotent processing." },
    {
      id: "sdi-c2",
      front: "Idempotent consumer technique?",
      back: "Insert the message id into a unique-keyed table in the same transaction as the side effect.",
    },
    { id: "sdi-c3", front: "Retry best practice?", back: "Exponential backoff with jitter, a retry budget, only for retryable errors." },
    { id: "sdi-c4", front: "Transactional outbox?", back: "Write the event to an outbox table in the same DB transaction; a relay/CDC publishes it." },
  ],
};

export const sdObservability: LessonBody = {
  id: "sd-observability",
  blocks: [
    {
      type: "md",
      md: `You can't operate what you can't see. **Observability** is being able to answer new questions about production without shipping new code. Its three signals:

- **Metrics**: cheap numeric time series for dashboards and alerts (rate, errors, latency).
- **Logs**: detailed, structured records of events.
- **Traces**: one request's journey across services, with timing per hop.`,
    },
    {
      type: "compare",
      title: "From signals to decisions",
      headers: ["Term", "Meaning", "Example"],
      rows: [
        ["SLI", "A measured indicator", "% of requests served under 300 ms"],
        ["SLO", "The target for an SLI", "99.9% of requests under 300 ms over 30 days"],
        ["Error budget", "1 − SLO, the failure you can afford", "~43 minutes per month at 99.9%"],
        ["SLA", "A contractual promise with penalties", "Credits if availability < 99.5%"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Alert on symptoms, not causes",
      md: "Page someone when users hurt (SLO burn rate is high), not when CPU is at 80%. Cause-based alerts are noisy; symptom-based alerts are actionable.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "Golden signals",
      md: "Latency, traffic, errors, saturation. For services, the RED method: Rate, Errors, Duration.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Unstructured logs nobody can query",
        "High-cardinality labels (userId) on metrics exploding storage",
        "Averages instead of percentiles for latency",
        "No trace or correlation id passed between services",
      ],
    },
    { type: "quiz", ids: ["sdo-q1", "sdo-q2"] },
  ],
  quiz: [
    {
      id: "sdo-q1",
      prompt: "Why report p99 latency instead of the average?",
      choices: ["It's smaller", "Averages hide the slow tail that real users feel", "It's required by Prometheus", "It's cheaper"],
      answer: 1,
      explanation: "A mean of 50 ms can hide 1% of requests taking 5 s.",
    },
    {
      id: "sdo-q2",
      prompt: "An SLO of 99.9% monthly availability gives an error budget of about…",
      choices: ["4 minutes", "43 minutes", "7 hours", "3 days"],
      answer: 1,
      explanation: "0.1% of ~43,200 minutes ≈ 43 minutes.",
    },
  ],
  cards: [
    { id: "sdo-c1", front: "Three pillars of observability?", back: "Metrics, logs, traces." },
    { id: "sdo-c2", front: "SLI vs SLO vs SLA?", back: "SLI: measurement. SLO: internal target. SLA: contractual promise with penalties." },
    { id: "sdo-c3", front: "RED method?", back: "Rate, Errors, Duration, per service." },
    { id: "sdo-c4", front: "99.9% monthly error budget?", back: "≈ 43 minutes of downtime per month." },
  ],
};

export const sdSearch: LessonBody = {
  id: "sd-search",
  blocks: [
    {
      type: "md",
      md: `Databases find rows by exact values; search engines find documents by **words**. The core structure is an **inverted index**: for each term, the list of documents containing it. Queries intersect those lists and rank results by relevance (BM25 and friends).`,
    },
    {
      type: "steps",
      title: "Keeping search in sync",
      items: [
        { title: "Source of truth stays in the DB", md: "The search index is a derived, rebuildable copy." },
        { title: "Stream changes", md: "Change data capture (Debezium) or domain events to Kafka." },
        { title: "Index asynchronously", md: "A consumer updates Elasticsearch; accept seconds of lag." },
        { title: "Re-index without downtime", md: "Build a new index, then switch an alias atomically." },
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Autocomplete",
      md: "Prefix queries over edge n-grams, or a trie of popular queries with top-k suggestions per prefix, refreshed from query logs.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Writing to DB and search index in the request path (dual write)",
        "Treating search results as authoritative (always re-check permissions and stock)",
        "Deep pagination on search results (use search_after)",
        "Ignoring analyzers (stemming, lowercase) and wondering why matches fail",
      ],
    },
    { type: "quiz", ids: ["sdse-q1", "sdse-q2"] },
  ],
  quiz: [
    {
      id: "sdse-q1",
      prompt: "What is an inverted index?",
      choices: ["A B-tree sorted in reverse", "A map from each term to the documents containing it", "A cache of query results", "A replica"],
      answer: 1,
      explanation: "It inverts documents→words into words→documents, making term lookups fast.",
    },
    {
      id: "sdse-q2",
      prompt: "Best way to keep Elasticsearch in sync with PostgreSQL?",
      choices: ["Write to both in the request", "CDC or events into an async indexer", "Nightly full copy only", "Query PostgreSQL with LIKE instead"],
      answer: 1,
      explanation: "Asynchronous, replayable streaming avoids dual writes and supports rebuilding.",
    },
  ],
  cards: [
    { id: "sdse-c1", front: "Inverted index?", back: "Term → posting list of documents (and positions) containing it." },
    { id: "sdse-c2", front: "Zero-downtime re-index?", back: "Build a new index, then atomically swap an alias." },
    { id: "sdse-c3", front: "Search index role?", back: "Derived, rebuildable read model; the DB stays the source of truth." },
  ],
};
