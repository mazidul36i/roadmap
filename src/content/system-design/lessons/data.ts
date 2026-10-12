import type { LessonBody } from "@content/types";

export const sdCaching: LessonBody = {
  id: "sd-caching",
  blocks: [
    {
      type: "md",
      md: `A cache trades **freshness for speed**. It shines when reads vastly outnumber writes and a slightly stale answer is acceptable. The two hard parts are deciding *what* to cache and *when it stops being true*.`,
    },
    {
      type: "compare",
      title: "Caching strategies",
      headers: ["Strategy", "How it works", "Good for", "Risk"],
      rows: [
        ["Cache-aside (lazy)", "App reads cache; on miss reads DB and fills cache", "Most read-heavy workloads", "Stale data until TTL or invalidation"],
        ["Write-through", "Write to cache and DB together", "Data read right after it's written", "Slower writes; caches unread data"],
        ["Write-behind", "Write to cache, flush to DB later", "Very write-heavy, tolerant of loss", "Data loss if the cache dies"],
        ["Read-through", "Cache library loads from DB on miss", "Cleaner app code", "Same staleness as cache-aside"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Cache-aside with Spring",
      code: `@Cacheable(cacheNames = "profiles", key = "#userId")
public Profile getProfile(long userId) {
    return profileRepository.findById(userId).orElseThrow();
}

@CacheEvict(cacheNames = "profiles", key = "#profile.userId")
public Profile update(Profile profile) {
    return profileRepository.save(profile);   // evict, don't update: avoids racing writers
}`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Delete, don't update",
      md: "On writes, invalidate the cache entry rather than writing the new value into it. Two concurrent writers updating the cache can leave the older value there forever; deleting lets the next read load the truth.",
    },
    {
      type: "compare",
      title: "Failure modes and fixes",
      headers: ["Problem", "What happens", "Fix"],
      rows: [
        [
          "Stampede (thundering herd)",
          "A hot key expires; thousands of requests hit the DB at once",
          "Request coalescing / single-flight lock, early refresh, jittered TTLs",
        ],
        ["Penetration", "Requests for keys that don't exist always miss", "Cache negative results briefly; Bloom filter"],
        ["Hot key", "One key overwhelms a single cache node", "Local in-process cache, key replication"],
        ["Avalanche", "Many keys expire at the same moment", "Randomise TTLs"],
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Eviction",
      md: "LRU (least recently used) is the safe default; LFU keeps long-term popular items. Size the cache to the hot working set, which is often 20% of keys serving 80% of reads.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Caching data that must be strongly consistent (balances, inventory) without a plan",
        "No TTL at all, so stale data lives forever",
        "Updating cache and DB in two non-atomic steps",
        "Treating the cache as durable storage",
      ],
    },
    { type: "quiz", ids: ["sdc-q1", "sdc-q2", "sdc-q3"] },
  ],
  quiz: [
    {
      id: "sdc-q1",
      prompt: "A celebrity's profile key expires and 50,000 requests miss at once. What's this and the fix?",
      choices: [
        "Cache penetration; Bloom filter",
        "Cache stampede; single-flight/coalescing or early refresh",
        "Hot partition; sharding",
        "Avalanche; bigger cache",
      ],
      answer: 1,
      explanation: "Many concurrent misses on one hot key is a stampede. Let one request rebuild while others wait or serve stale.",
    },
    {
      id: "sdc-q2",
      prompt: "On a write with cache-aside, what should you do with the cache?",
      choices: ["Write the new value into the cache", "Delete the key", "Nothing; wait for the TTL", "Flush the whole cache"],
      answer: 1,
      explanation: "Deleting avoids races where concurrent writers leave an old value cached.",
    },
    {
      id: "sdc-q3",
      prompt: "Lots of requests for IDs that don't exist keep hitting the database. Fix?",
      choices: ["Increase TTL", "Cache negative results or use a Bloom filter", "Add replicas", "Use write-through"],
      answer: 1,
      explanation: "That's cache penetration; remember 'not found' briefly or check membership first.",
    },
  ],
  cards: [
    { id: "sdc-c1", front: "Cache-aside read and write paths?", back: "Read: cache, on miss DB then fill. Write: update DB, then delete the cache key." },
    {
      id: "sdc-c2",
      front: "Cache stampede fixes?",
      back: "Single-flight/request coalescing, early (probabilistic) refresh, jittered TTLs, serve stale while revalidating.",
    },
    {
      id: "sdc-c3",
      front: "Write-through vs write-behind?",
      back: "Through: synchronous to cache + DB (consistent, slower). Behind: async flush (fast, can lose data).",
    },
    { id: "sdc-c4", front: "Cache penetration?", back: "Misses for non-existent keys hammer the DB; cache negatives or use a Bloom filter." },
    { id: "sdc-c5", front: "When NOT to cache?", back: "Write-heavy data, or data needing strong consistency (balances, stock) without an invalidation plan." },
  ],
};

export const sdSharding: LessonBody = {
  id: "sd-sharding",
  blocks: [
    {
      type: "md",
      md: `**Replication** copies the same data to several nodes (for reads and survival). **Sharding** splits different data across nodes (for writes and size). Most large systems do both: each shard is a small replicated cluster.`,
    },
    {
      type: "compare",
      title: "Replication topologies",
      headers: ["Topology", "Writes go to", "Trade-off"],
      rows: [
        ["Leader–follower", "One leader", "Simple; followers lag (stale reads); failover needed"],
        ["Multi-leader", "Several leaders (often per region)", "Local writes everywhere; must resolve conflicts"],
        ["Leaderless (quorum)", "Any N replicas, W must ack", "Tunable: R + W > N gives read-your-writes-ish consistency"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Quorums",
      md: "With N replicas, writing to W and reading from R where **R + W > N** guarantees the read set overlaps the latest write. N = 3, W = 2, R = 2 is the classic choice.",
    },
    {
      type: "compare",
      title: "Choosing a shard key",
      headers: ["Strategy", "Pros", "Cons"],
      rows: [
        ["Hash of key", "Even spread", "Range queries hit every shard"],
        ["Range of key", "Efficient range scans", "Hot spots (e.g. latest timestamps)"],
        ["Consistent hashing", "Adding a node moves only ~1/N of keys", "Needs virtual nodes for balance"],
        ["Directory/lookup", "Flexible placement", "Lookup service is a dependency"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Consistent hashing ring (sketch)",
      code: `TreeMap<Long, String> ring = new TreeMap<>();
void addNode(String node) {
    for (int v = 0; v < 100; v++) ring.put(hash(node + "#" + v), node); // virtual nodes
}
String nodeFor(String key) {
    Map.Entry<Long, String> e = ring.ceilingEntry(hash(key));
    return (e != null ? e : ring.firstEntry()).getValue();          // wrap around
}`,
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "A shard key that makes one shard hot (celebrity users, today's date)",
        "Cross-shard joins and transactions everywhere",
        "Re-sharding with modulo hashing, which moves almost every key",
        "Reading from a lagging replica right after a write (read-your-writes)",
      ],
    },
    { type: "quiz", ids: ["sdsh-q1", "sdsh-q2"] },
  ],
  quiz: [
    {
      id: "sdsh-q1",
      prompt: "N = 5 replicas. Which (W, R) guarantees a read sees the latest acknowledged write?",
      choices: ["W=2, R=2", "W=3, R=3", "W=1, R=1", "W=2, R=3"],
      answer: 1,
      explanation: "Need R + W > N: 3 + 3 = 6 > 5.",
    },
    {
      id: "sdsh-q2",
      prompt: "Why use consistent hashing instead of hash(key) % N?",
      choices: ["It's faster to compute", "Adding or removing a node moves only about 1/N of keys", "It sorts keys", "It avoids replication"],
      answer: 1,
      explanation: "Modulo remaps nearly every key when N changes; the ring only moves the keys near the new node.",
    },
  ],
  cards: [
    { id: "sdsh-c1", front: "Replication vs sharding?", back: "Replication copies the same data (reads, availability). Sharding splits data (writes, size)." },
    { id: "sdsh-c2", front: "Quorum condition for fresh reads?", back: "R + W > N." },
    { id: "sdsh-c3", front: "Why virtual nodes in consistent hashing?", back: "To spread load evenly; each physical node owns many small ranges." },
    { id: "sdsh-c4", front: "Hot spot causes?", back: "Skewed shard keys: monotonically increasing keys in range sharding, or a few very popular entities." },
  ],
};

export const sdConsistency: LessonBody = {
  id: "sd-consistency",
  blocks: [
    {
      type: "md",
      md: `**CAP** says: when a network **P**artition happens, a distributed system must choose between **C**onsistency (every read sees the latest write) and **A**vailability (every request gets an answer). Partitions aren't optional, so the real choice is CP or AP *during* a partition.

**PACELC** adds the everyday case: **E**lse, when there's no partition, you still trade **L**atency against **C**onsistency, because coordinating replicas takes time.`,
    },
    {
      type: "compare",
      title: "Consistency models (strongest first)",
      headers: ["Model", "Guarantee", "Example use"],
      rows: [
        ["Linearizable", "Reads see the most recent write, as if one copy", "Leader election, locks, balances"],
        ["Sequential / causal", "Everyone sees causally related writes in order", "Comments and replies"],
        ["Read-your-writes", "You always see your own updates", "Profile edits"],
        ["Eventual", "Replicas converge if writes stop", "Like counts, view counters"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Choose per feature, not per system",
      md: "A shopping site can be eventually consistent for product reviews and strongly consistent for checkout. Saying that in an interview shows mature judgement.",
    },
    {
      type: "compare",
      title: "Where popular stores sit",
      headers: ["System", "During a partition", "Normally"],
      rows: [
        ["Single-leader SQL (sync replica)", "CP", "Favours consistency (EC)"],
        ["Cassandra / Dynamo-style", "AP (tunable)", "Favours latency (EL)"],
        ["Spanner", "CP", "EC, using TrueTime to keep latency reasonable"],
        ["ZooKeeper / etcd", "CP", "EC"],
      ],
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Saying 'I'll pick CA' (you can't opt out of partitions)",
        "Using eventual consistency for money or inventory without compensation",
        "Forgetting read-your-writes for a user editing their own data",
        "Treating 'consistency' in CAP as the C in ACID (it isn't)",
      ],
    },
    { type: "quiz", ids: ["sdcs-q1", "sdcs-q2"] },
  ],
  quiz: [
    {
      id: "sdcs-q1",
      prompt: "During a network partition, a CP system will…",
      choices: ["Return possibly stale data", "Reject or block some requests to stay consistent", "Duplicate writes", "Ignore the partition"],
      answer: 1,
      explanation: "It sacrifices availability on the minority side rather than serve inconsistent data.",
    },
    {
      id: "sdcs-q2",
      prompt: "What does PACELC add to CAP?",
      choices: ["Durability", "The latency vs consistency trade-off when there's no partition", "Partition tolerance", "Encryption"],
      answer: 1,
      explanation: "Else (no partition): Latency vs Consistency.",
    },
  ],
  cards: [
    { id: "sdcs-c1", front: "CAP in one sentence?", back: "During a network partition, choose consistency or availability." },
    { id: "sdcs-c2", front: "PACELC?", back: "If Partition: A vs C; Else: Latency vs Consistency." },
    { id: "sdcs-c3", front: "Read-your-writes guarantee?", back: "A user always sees their own updates, even if others see them later." },
    { id: "sdcs-c4", front: "CAP's C vs ACID's C?", back: "CAP C = linearizable reads. ACID C = transactions preserve invariants/constraints." },
  ],
};
