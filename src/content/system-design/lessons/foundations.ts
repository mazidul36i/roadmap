import type { LessonBody } from "@content/types";

export const sdFramework: LessonBody = {
  id: "sd-framework",
  blocks: [
    {
      type: "md",
      md: `A system design interview is graded less on the final diagram than on **how you get there**. Interviewers want to see that you scope before you build, quantify before you choose, and can defend every trade-off.

Use the same five-step plan for every question and you'll never freeze.`,
    },
    {
      type: "steps",
      title: "The 45-minute game plan",
      items: [
        { title: "Requirements (≈5 min)", md: "Functional: the 3 to 5 core features, explicitly out-of-scope items. Non-functional: scale (users, QPS), latency targets, availability, consistency needs, read/write ratio." },
        { title: "Estimates (≈3 min)", md: "Peak QPS, storage per year, bandwidth. Only the numbers that change a decision." },
        { title: "API & data model (≈7 min)", md: "The handful of endpoints, their request/response shapes, and the main entities with their access patterns." },
        { title: "High-level design (≈10 min)", md: "Clients, load balancer, services, databases, caches, queues. Walk one request end to end." },
        { title: "Deep dives & trade-offs (≈15 min)", md: "Pick the hardest one or two parts (or let the interviewer pick). Discuss bottlenecks, failure modes, and what you'd change at 10× scale." },
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Say the trade-off out loud",
      md: "Every choice should come with *why* and *at what cost*: \"I'll use a cache-aside Redis layer because reads are 100:1; the cost is staleness up to the TTL, which is fine for profile data.\" That sentence is worth more than a perfect diagram.",
    },
    {
      type: "compare",
      title: "Questions that change the design",
      headers: ["Ask", "Because it decides"],
      rows: [
        ["How many users / requests at peak?", "Single node vs sharding, caching, CDN"],
        ["Read-heavy or write-heavy?", "Caching strategy, replicas vs partitions"],
        ["How fresh must reads be?", "Strong vs eventual consistency"],
        ["Can we lose data? Duplicate it?", "Durability, idempotency, delivery semantics"],
        ["Latency target (p99)?", "Sync vs async paths, edge caching"],
        ["Global or single region?", "Replication topology, conflict handling"],
      ],
    },
    {
      type: "checklist",
      title: "Common ways to lose the round",
      items: [
        "Drawing boxes before agreeing what the system must do",
        "Naming technologies without saying why (\"Kafka because it's popular\")",
        "Designing for Google scale when the requirement is 1,000 users",
        "Never mentioning failure: what happens when this box dies?",
        "Monologuing for 20 minutes without checking in with the interviewer",
      ],
    },
    { type: "callout", tone: "tip", title: "Practise it", md: "Run a full exercise in the **Design exercises** tab of this track: a timed walk through all five steps with reference answers and an optional AI review." },
    { type: "quiz", ids: ["sdf-q1", "sdf-q2", "sdf-q3"] },
  ],
  quiz: [
    { id: "sdf-q1", prompt: "What should you do in the first five minutes?", choices: ["Draw the architecture", "Pin down functional and non-functional requirements", "Choose the database", "Estimate storage for 10 years"], answer: 1, explanation: "Everything else depends on scope and scale. Designing before agreeing on them is the most common failure." },
    { id: "sdf-q2", prompt: "Which estimate is usually worth doing?", choices: ["Exact number of servers", "Peak QPS and storage growth", "Cost per request in cents", "Network packet sizes"], answer: 1, explanation: "Those two drive the big decisions (caching, sharding, storage type). Skip numbers that don't change a choice." },
    { id: "sdf-q3", prompt: "The best way to present a design choice is…", choices: ["Name the most scalable technology", "State the choice, the reason, and the cost you're accepting", "Offer three options without choosing", "Defer to the interviewer"], answer: 1, explanation: "Interviewers grade reasoning about trade-offs. Commit to a choice and own its downside." },
  ],
  cards: [
    { id: "sdf-c1", front: "Five steps of a system design interview?", back: "Requirements → estimates → API & data model → high-level design → deep dives & trade-offs." },
    { id: "sdf-c2", front: "Non-functional requirements to always clarify?", back: "Scale (users/QPS), read/write ratio, latency target, availability, consistency, durability." },
    { id: "sdf-c3", front: "How should every design decision be phrased?", back: "Choice + reason + accepted cost (the trade-off)." },
    { id: "sdf-c4", front: "What to cover in a deep dive?", back: "Bottlenecks, failure modes, data consistency, and what changes at 10× scale." },
  ],
};

export const sdEstimation: LessonBody = {
  id: "sd-estimation",
  blocks: [
    {
      type: "md",
      md: `Estimation exists to answer one question: **does this fit on one machine, or do we need to distribute it?** Round aggressively, write your assumptions down, and stop as soon as the numbers make a decision obvious.

Useful shortcuts:

- A day has **~86,400 seconds ≈ 10⁵**. So 1 million requests per day ≈ **12 per second**.
- Peak is usually **2 to 5× the average**.
- 1 KB × 1 billion = **1 TB**.`,
    },
    {
      type: "compare",
      title: "Numbers worth memorising (orders of magnitude)",
      headers: ["Operation", "Latency"],
      rows: [
        ["L1 cache reference", "~1 ns"],
        ["Main memory reference", "~100 ns"],
        ["Read 1 MB sequentially from memory", "~3 µs"],
        ["SSD random read", "~16 µs to 100 µs"],
        ["Round trip within a datacenter", "~0.5 ms"],
        ["Read 1 MB sequentially from SSD", "~50 µs to 1 ms"],
        ["Disk seek (HDD)", "~2 to 10 ms"],
        ["Round trip across continents", "~100 to 150 ms"],
      ],
    },
    {
      type: "steps",
      title: "Worked example: a photo-sharing feed",
      items: [
        { title: "Users", md: "100 M daily active users, each views the feed 10 times and uploads 0.1 photos per day." },
        { title: "Read QPS", md: "100 M × 10 = 10⁹ views/day ÷ 10⁵ s ≈ **10,000 QPS** average, **~30,000** at peak." },
        { title: "Write QPS", md: "100 M × 0.1 = 10⁷ uploads/day ≈ **100 QPS**: reads dominate 100:1, so caching pays off hugely." },
        { title: "Storage", md: "10⁷ photos/day × 500 KB ≈ **5 TB/day ≈ 1.8 PB/year** → object storage (S3), not a database." },
        { title: "Decision", md: "Metadata in a sharded DB, images in object storage behind a CDN, feeds served from a cache." },
      ],
    },
    { type: "callout", tone: "insight", title: "Estimate, then decide", md: "Each number should end in a sentence like \"…so we need a CDN\" or \"…so one Postgres primary is plenty\". If a number doesn't change a decision, skip it." },
    { type: "callout", tone: "tip", title: "Powers of two", md: "2¹⁰ ≈ 1 thousand (KB), 2²⁰ ≈ 1 million (MB), 2³⁰ ≈ 1 billion (GB), 2⁴⁰ ≈ 1 trillion (TB). A 64-bit ID is 8 bytes; a UUID is 16." },
    { type: "checklist", title: "Pitfalls", items: ["Precise arithmetic that wastes five minutes", "Forgetting peak vs average", "Ignoring replication (3× storage) and indexes", "Mixing bits and bytes in bandwidth"] },
    { type: "quiz", ids: ["sde-q1", "sde-q2", "sde-q3"] },
  ],
  quiz: [
    { id: "sde-q1", prompt: "10 million requests per day is roughly how many per second on average?", choices: ["~12", "~120", "~1,200", "~12,000"], answer: 1, explanation: "10⁷ ÷ 10⁵ ≈ 100. Precisely 10⁷ / 86,400 ≈ 116." },
    { id: "sde-q2", prompt: "Storing 1 billion records of 1 KB each needs about…", choices: ["1 GB", "100 GB", "1 TB", "1 PB"], answer: 2, explanation: "10⁹ × 10³ bytes = 10¹² bytes = 1 TB (before replication and indexes)." },
    { id: "sde-q3", prompt: "Which is fastest?", choices: ["SSD random read", "Main memory reference", "Datacenter round trip", "Disk seek"], answer: 1, explanation: "Memory ≈ 100 ns; SSD ≈ tens of µs; network round trip ≈ 0.5 ms; disk seek ≈ milliseconds." },
  ],
  cards: [
    { id: "sde-c1", front: "Seconds in a day, rounded for estimates?", back: "~10⁵ (86,400). 1 M/day ≈ 12/s." },
    { id: "sde-c2", front: "Peak vs average traffic rule of thumb?", back: "Peak ≈ 2–5× average." },
    { id: "sde-c3", front: "Memory reference vs datacenter round trip?", back: "~100 ns vs ~0.5 ms: about 5,000× slower over the network." },
    { id: "sde-c4", front: "1 KB × 1 billion = ?", back: "1 TB." },
    { id: "sde-c5", front: "Purpose of estimation in an interview?", back: "To make decisions: one box or many, cache or not, DB or object storage." },
  ],
};

export const sdApiDesign: LessonBody = {
  id: "sd-api-design",
  blocks: [
    {
      type: "md",
      md: `A good API is boring in the best way: **resources are nouns, verbs are HTTP methods, and failure is predictable**. In an interview, sketch 3 to 5 endpoints with request and response shapes; that grounds the rest of the design.`,
    },
    {
      type: "code",
      lang: "text",
      title: "Example: a URL shortener",
      code: `POST   /v1/links                { "url": "...", "alias"?: "..." }   → 201 { "code": "a1B2c3", "shortUrl": "..." }
GET    /v1/links/{code}                                              → 200 { "url": "...", "clicks": 42 }
GET    /{code}                                                       → 301/302 Location: <long url>
DELETE /v1/links/{code}                                              → 204`,
    },
    {
      type: "compare",
      title: "Decisions that come up every time",
      headers: ["Topic", "Default choice", "Why"],
      rows: [
        ["Pagination", "Cursor (opaque token), not offset", "Stable under inserts, O(1) per page"],
        ["Retried writes", "Idempotency-Key header", "A retry never creates a duplicate"],
        ["Versioning", "/v1 in the path", "Simple, cache-friendly, explicit"],
        ["Errors", "Proper status + machine-readable code", "Clients can branch on 409 vs 422"],
        ["Large or slow work", "202 Accepted + status resource", "Don't hold connections open"],
        ["Service-to-service", "gRPC/protobuf", "Typed contracts, efficient, streaming"],
      ],
    },
    { type: "callout", tone: "insight", title: "301 vs 302 for redirects", md: "A 301 is cached by browsers, so you lose click analytics after the first visit; a 302 (or 307) hits your service every time. Pick based on whether you need the counts, and say so." },
    {
      type: "code",
      lang: "java",
      title: "Idempotent create in Spring",
      code: `@PostMapping("/v1/payments")
ResponseEntity<Payment> create(@RequestHeader("Idempotency-Key") String key,
                               @RequestBody PaymentRequest req) {
    return idempotencyStore.find(key)                 // same key → same response
        .map(ResponseEntity::ok)
        .orElseGet(() -> {
            Payment p = payments.create(req);
            idempotencyStore.save(key, p);            // store atomically with the write
            return ResponseEntity.status(201).body(p);
        });
}`,
    },
    { type: "checklist", title: "Pitfalls", items: ["Verbs in URLs (`/getUser`)", "Offset pagination on large, fast-changing tables", "Returning 200 with an error body", "Breaking changes without a new version"] },
    { type: "quiz", ids: ["sda-q1", "sda-q2"] },
  ],
  quiz: [
    { id: "sda-q1", prompt: "Why prefer cursor pagination over offset for a busy feed?", choices: ["It's easier to implement", "Offsets skip or repeat items as rows are inserted, and get slower with depth", "Cursors are cacheable by CDNs", "Offset isn't valid HTTP"], answer: 1, explanation: "A cursor anchors to a position (e.g. last seen id/timestamp), so pages stay stable and each query uses an index seek." },
    { id: "sda-q2", prompt: "A client retries a POST after a timeout. How do you avoid charging twice?", choices: ["Use GET instead", "Idempotency key stored with the result", "Shorter timeouts", "Database triggers"], answer: 1, explanation: "The server records the key with the outcome and returns the same result for repeats." },
  ],
  cards: [
    { id: "sda-c1", front: "Cursor vs offset pagination?", back: "Cursor: stable under inserts and O(1) per page via index seek. Offset: shifts and gets slower with depth." },
    { id: "sda-c2", front: "How to make a POST safe to retry?", back: "Idempotency-Key header; store key → result atomically and replay it for repeats." },
    { id: "sda-c3", front: "301 vs 302 in a URL shortener?", back: "301 is cached (fewer hits, lost analytics); 302/307 hits the service every time." },
    { id: "sda-c4", front: "Long-running request pattern?", back: "202 Accepted with a status resource to poll (or a webhook/callback)." },
  ],
};

export const sdStorage: LessonBody = {
  id: "sd-storage",
  blocks: [
    {
      type: "md",
      md: `Pick storage by **access pattern**, not by fashion. Ask: what are the queries, how big does it get, and what consistency do I need? Most systems end up with several stores, each doing what it's best at.`,
    },
    {
      type: "compare",
      title: "Storage families",
      headers: ["Type", "Great for", "Watch out for", "Examples"],
      rows: [
        ["Relational", "Transactions, joins, constraints, ad-hoc queries", "Scaling writes beyond one primary", "PostgreSQL, MySQL"],
        ["Key-value", "Lookups by key at huge scale, sessions, caches", "No secondary queries", "Redis, DynamoDB"],
        ["Document", "Flexible, nested records read as a whole", "Cross-document transactions and joins", "MongoDB"],
        ["Wide-column", "Massive write throughput, time series by partition", "Query flexibility; model by query", "Cassandra, HBase"],
        ["Object storage", "Blobs: images, video, backups, logs", "Not for small, frequently updated records", "S3, GCS"],
        ["Search index", "Full-text and faceted search", "It's a derived copy, not the source of truth", "Elasticsearch, OpenSearch"],
      ],
    },
    { type: "callout", tone: "insight", title: "Default to relational", md: "A single well-indexed PostgreSQL primary with read replicas handles far more than most interview prompts imply (tens of thousands of QPS). Reach for NoSQL when you can name the specific limit you're hitting." },
    {
      type: "compare",
      title: "Indexes in one table",
      headers: ["Index", "Speeds up", "Costs"],
      rows: [
        ["B-tree (default)", "Equality and range queries, ORDER BY", "Slower writes, extra storage"],
        ["Composite (a, b)", "Filters on a, or a + b (left-prefix rule)", "Useless for filters on b alone"],
        ["Hash", "Exact matches", "No ranges"],
        ["LSM-tree storage", "Very high write rates", "Read amplification, compaction"],
      ],
    },
    { type: "checklist", title: "Pitfalls", items: ["Choosing a NoSQL store and then needing joins everywhere", "Storing images or large blobs in the database", "Missing an index on the column every query filters by", "Treating the search index as the source of truth"] },
    { type: "quiz", ids: ["sds-q1", "sds-q2", "sds-q3"] },
  ],
  quiz: [
    { id: "sds-q1", prompt: "Where should user-uploaded videos live?", choices: ["PostgreSQL bytea column", "Object storage with metadata in a DB", "Redis", "Elasticsearch"], answer: 1, explanation: "Blobs belong in object storage (cheap, durable, CDN-friendly); keep searchable metadata in a database." },
    { id: "sds-q2", prompt: "A composite index on (country, created_at) helps which query?", choices: ["WHERE created_at > ?", "WHERE country = ? AND created_at > ?", "WHERE name = ?", "ORDER BY name"], answer: 1, explanation: "Left-prefix rule: the index is usable for country, or country + created_at, but not created_at alone." },
    { id: "sds-q3", prompt: "Billions of sensor readings written per day, always queried by device and time. Best fit?", choices: ["Relational with joins", "Wide-column store partitioned by device", "Graph database", "Object storage only"], answer: 1, explanation: "Write-heavy, time-ordered, queried by a known partition key: the sweet spot for Cassandra-style stores." },
  ],
  cards: [
    { id: "sds-c1", front: "How to choose storage in a design interview?", back: "By access pattern: queries, size, write rate, consistency. Default to relational until a named limit forces otherwise." },
    { id: "sds-c2", front: "Left-prefix rule for composite indexes?", back: "An index on (a, b) serves filters on a or a + b, not b alone." },
    { id: "sds-c3", front: "B-tree vs LSM storage engines?", back: "B-tree: balanced reads/writes, in-place updates. LSM: very fast writes, read and compaction amplification." },
    { id: "sds-c4", front: "Where do blobs go?", back: "Object storage (S3/GCS) behind a CDN; metadata in a database." },
  ],
};
