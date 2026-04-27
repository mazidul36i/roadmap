import type {
  Application,
  AppState,
  DSAProblem,
  MockInterview,
  Note,
  Resource,
  StoryCard,
  SystemDesignTopic,
  Week
} from "@app-types/index";

const uid = () => crypto.randomUUID();

// ─── 8-WEEK ROADMAP ────────────────────────────────────────────────────────────
const weeks: Week[] = [
  {
    id: "w1", number: 1,
    title: "Story Bank + DSA Baseline",
    goal: "Document your Prospecta experience in STAR format and establish a DSA baseline across all core topics.",
    tasks: [
      { id: uid(), weekId: "w1", title: "Write 5 STAR stories from Prospecta work", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w1",
        title: "Tag stories by topic (performance, reliability, architecture, etc.)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w1",
        title: "Solve 20 easy LeetCode problems (Arrays, Strings, Hashmaps)",
        status: "todo",
        notes: ""
      },
      { id: uid(), weekId: "w1", title: "Review Big-O notation and complexity analysis", status: "todo", notes: "" },
      { id: uid(), weekId: "w1", title: "Update and tailor your resume for target roles", status: "todo", notes: "" },
      { id: uid(), weekId: "w1", title: "Set up a list of 30 target companies", status: "todo", notes: "" },
    ]
  },
  {
    id: "w2", number: 2,
    title: "DSA Patterns",
    goal: "Master the most common algorithmic patterns: two-pointer, sliding window, prefix sum, binary search.",
    tasks: [
      { id: uid(), weekId: "w2", title: "Two Pointer: 10 problems", status: "todo", notes: "" },
      { id: uid(), weekId: "w2", title: "Sliding Window: 10 problems", status: "todo", notes: "" },
      { id: uid(), weekId: "w2", title: "Binary Search: 8 problems", status: "todo", notes: "" },
      { id: uid(), weekId: "w2", title: "Prefix Sum + Difference Array: 5 problems", status: "todo", notes: "" },
      { id: uid(), weekId: "w2", title: "Stack & Monotonic Stack: 8 problems", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w2",
        title: "Review pattern notes and add to DSA notes section",
        status: "todo",
        notes: ""
      },
    ]
  },
  {
    id: "w3", number: 3,
    title: "Trees, Graphs & Heaps",
    goal: "Build strong intuition on tree traversals, graph algorithms, and heap-based problems.",
    tasks: [
      {
        id: uid(),
        weekId: "w3",
        title: "Binary Trees: traversals, LCA, diameter (10 problems)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w3",
        title: "BST: insert, delete, validate, kth smallest (6 problems)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w3",
        title: "Graph BFS/DFS: connected components, islands (8 problems)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w3",
        title: "Shortest paths: Dijkstra, Bellman-Ford (4 problems)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w3",
        title: "Heap/Priority Queue: top-K, merge K lists (6 problems)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w3",
        title: "DP Introduction: Fibonacci, climb stairs, coin change (6 problems)",
        status: "todo",
        notes: ""
      },
    ]
  },
  {
    id: "w4", number: 4,
    title: "System Design Foundations",
    goal: "Build a repeatable system design framework. Study core concepts and design 3 classic systems.",
    tasks: [
      { id: uid(), weekId: "w4", title: "Study: Horizontal vs Vertical scaling", status: "todo", notes: "" },
      { id: uid(), weekId: "w4", title: "Study: Load balancers, CDNs, DNS", status: "todo", notes: "" },
      { id: uid(), weekId: "w4", title: "Study: SQL vs NoSQL, CAP theorem, ACID vs BASE", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w4",
        title: "Study: Caching strategies (write-through, write-back, LRU)",
        status: "todo",
        notes: ""
      },
      { id: uid(), weekId: "w4", title: "Design: URL Shortener (like bit.ly)", status: "todo", notes: "" },
      { id: uid(), weekId: "w4", title: "Design: Rate Limiter", status: "todo", notes: "" },
      { id: uid(), weekId: "w4", title: "Design: Pastebin", status: "todo", notes: "" },
    ]
  },
  {
    id: "w5", number: 5,
    title: "Backend Architecture Depth",
    goal: "Go deeper into distributed systems, message queues, data pipelines, and backend reliability patterns.",
    tasks: [
      {
        id: uid(),
        weekId: "w5",
        title: "Study: Message queues (Kafka, RabbitMQ) and async processing",
        status: "todo",
        notes: ""
      },
      { id: uid(), weekId: "w5", title: "Study: Event-driven architecture and CQRS", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w5",
        title: "Study: Data consistency patterns in distributed systems",
        status: "todo",
        notes: ""
      },
      { id: uid(), weekId: "w5", title: "Design: Notification Service (Email/SMS/Push)", status: "todo", notes: "" },
      { id: uid(), weekId: "w5", title: "Design: File Upload Service (like S3)", status: "todo", notes: "" },
      { id: uid(), weekId: "w5", title: "Design: Analytics Pipeline (real-time + batch)", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w5",
        title: "Advanced DP: Knapsack, LIS, longest common subsequence (8 problems)",
        status: "todo",
        notes: ""
      },
    ]
  },
  {
    id: "w6", number: 6,
    title: "Mock Interviews + Applications",
    goal: "Start applying aggressively. Begin mock interview sessions. Sharpen communication.",
    tasks: [
      { id: uid(), weekId: "w6", title: "Apply to 10 companies from target list", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w6",
        title: "Complete 2 DSA mock interviews (Pramp, Interviewing.io)",
        status: "todo",
        notes: ""
      },
      { id: uid(), weekId: "w6", title: "Complete 1 system design mock interview", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w6",
        title: "Review and refine story bank based on mock feedback",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w6",
        title: "Practice behavioral answers out loud (record yourself)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w6",
        title: "Strings & Advanced Patterns: Trie, Backtracking (8 problems)",
        status: "todo",
        notes: ""
      },
    ]
  },
  {
    id: "w7", number: 7,
    title: "Full Interview Mode",
    goal: "Treat every day as an interview day. Daily mock sessions, application follow-ups, and weak-area drilling.",
    tasks: [
      { id: uid(), weekId: "w7", title: "Apply to 15 more companies", status: "todo", notes: "" },
      { id: uid(), weekId: "w7", title: "Complete 3 DSA mock interviews", status: "todo", notes: "" },
      { id: uid(), weekId: "w7", title: "Complete 2 system design mock interviews", status: "todo", notes: "" },
      { id: uid(), weekId: "w7", title: "Drill weak DSA areas identified from mocks", status: "todo", notes: "" },
      { id: uid(), weekId: "w7", title: "Follow up on all pending applications", status: "todo", notes: "" },
      { id: uid(), weekId: "w7", title: "Prepare 5 smart questions to ask interviewers", status: "todo", notes: "" },
      {
        id: uid(),
        weekId: "w7",
        title: "Do a full system design round under timed conditions",
        status: "todo",
        notes: ""
      },
    ]
  },
  {
    id: "w8", number: 8,
    title: "Offers, Negotiation & Close",
    goal: "Evaluate and negotiate offers. Stay sharp while winding down. Close your next chapter.",
    tasks: [
      {
        id: uid(),
        weekId: "w8",
        title: "Research market compensation data (levels.fyi, Glassdoor)",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w8",
        title: "Prepare negotiation script and counter-offer strategy",
        status: "todo",
        notes: ""
      },
      {
        id: uid(),
        weekId: "w8",
        title: "Evaluate offer packages (base, equity, bonus, PTO, growth)",
        status: "todo",
        notes: ""
      },
      { id: uid(), weekId: "w8", title: "Complete any remaining interviews in pipeline", status: "todo", notes: "" },
      { id: uid(), weekId: "w8", title: "Write and send resignation letter professionally", status: "todo", notes: "" },
      { id: uid(), weekId: "w8", title: "Document learnings from the entire prep journey", status: "todo", notes: "" },
    ]
  },
];

// ─── STORY BANK (Prospecta experience) ─────────────────────────────────────────
const storyCards: StoryCard[] = [
  {
    id: uid(),
    title: "Improving Search Latency by 60%",
    problem: "Our product search API had P99 latency of 2.8s due to unoptimized Elasticsearch queries with multiple nested aggregations, causing poor user experience and elevated bounce rates.",
    action: "Profiled query execution plans and identified redundant nested aggregations. Restructured the query to use filter context instead of query context for non-scored filters. Introduced a Redis caching layer for frequent query patterns with a 5-minute TTL. Added index lifecycle management to prevent index bloat.",
    result: "P99 latency dropped from 2.8s to 1.1s (60% reduction). Cache hit rate stabilized at 68%. Customer complaints about search speed dropped to near-zero in the following sprint.",
    metrics: "60% latency reduction, 68% cache hit rate, 0 support tickets about search in 4 weeks post-deploy",
    shortVersion: "Reduced Elasticsearch search latency by 60% through query restructuring and Redis caching, improving P99 from 2.8s to 1.1s.",
    longVersion: "At Prospecta, the product search API was causing significant user experience issues with P99 latencies hitting 2.8 seconds. I led a performance investigation, profiling query execution plans in Elasticsearch and found that nested aggregations were running in query context rather than filter context, causing unnecessary scoring. I refactored the queries, moved filters to filter context, and introduced a Redis caching layer for the top 200 most common query patterns. I also set up ILM policies to manage index health. The result was a 60% drop in P99 latency and a sustained 68% cache hit rate.",
    tags: ["performance", "search", "optimization"],
  },
  {
    id: uid(),
    title: "Building Async Data Pipeline for ETL",
    problem: "Our supplier data ingestion was synchronous — when a large supplier uploaded 50,000 product records via CSV, it would block the API thread for 8–12 minutes, causing timeouts and failed uploads. Other requests on the same service were starved.",
    action: "Redesigned the ingestion flow to be fully async. The CSV upload endpoint now validates headers, enqueues the job to RabbitMQ, and returns a job ID immediately. A dedicated worker service consumes from the queue, processes records in batches of 500, and emits progress events via WebSocket. Added a dead-letter queue for failed records with auto-retry logic.",
    result: "Upload endpoint response time dropped from 8+ minutes to under 200ms. Zero timeouts on large uploads. Worker throughput of 5,000 records/minute sustained. Supplier onboarding cycle reduced by 70%.",
    metrics: "API response: 8min → <200ms, 0 timeouts, 5k records/min throughput, 70% faster supplier onboarding",
    shortVersion: "Replaced blocking CSV ingestion with an async RabbitMQ-backed pipeline, cutting upload response time from 8 minutes to 200ms.",
    longVersion: "Supplier CSV uploads were a major pain point at Prospecta — processing 50,000 records synchronously was timing out and blocking our API threads. I re-architected the flow: the upload endpoint now validates the file structure, publishes a job message to RabbitMQ with the S3 reference, and returns a job ID immediately. A separate worker service reads from the queue, processes records in batches with upsert logic, and sends real-time progress updates via WebSocket. Failed records go to a DLQ with 3 retries before alerting. This eliminated all upload timeouts and reduced the onboarding cycle for large suppliers by 70%.",
    tags: ["async processing", "data pipeline", "architecture", "reliability"],
  },
  {
    id: uid(),
    title: "Reducing Database Load with Query Optimization",
    problem: "A nightly reporting job was causing database CPU to spike to 95% for 45 minutes, affecting production read performance and causing occasional query timeouts for end users.",
    action: "Audited the reporting queries and found full table scans on a 15M-row orders table. Added composite indexes on (created_at, status, supplier_id). Rewrote a nested subquery to use CTEs. Moved the job to a read replica. Implemented incremental aggregation instead of full recalculation each night.",
    result: "CPU spike eliminated. Report generation time reduced from 45 minutes to 6 minutes. Zero production timeouts during reporting window. Index added without downtime using concurrent index creation.",
    metrics: "45min → 6min runtime, CPU spike eliminated, 0 user-facing timeouts, zero-downtime index migration",
    shortVersion: "Eliminated nightly 45-min database CPU spike through index optimization, CTE rewrite, and offloading to read replica.",
    longVersion: "Our nightly reports were causing severe CPU pressure on our primary PostgreSQL instance. I ran EXPLAIN ANALYZE on the heaviest queries and found sequential scans on a 15M-row orders table. I added composite indexes, rewrote N+1 patterns as CTEs, and moved the job to a read replica using connection string configuration. I also changed the aggregation strategy from full-table recalculation to incremental deltas — only processing new rows since the last run. The CPU spike was completely eliminated and the report now finishes in 6 minutes instead of 45.",
    tags: ["performance", "data pipeline", "optimization"],
  },
  {
    id: uid(),
    title: "Architecting Multi-Tenant Isolation",
    problem: "Prospecta's platform served multiple enterprise clients from a shared database schema. A data leak risk was identified — certain queries were missing tenant scoping, potentially allowing cross-tenant data access.",
    action: "Implemented a row-level security (RLS) model using PostgreSQL RLS policies. Added a mandatory tenant_id guard at the ORM layer via a custom query interceptor. Wrote automated tests to verify tenant isolation. Conducted a full audit of existing queries with a custom SQL linter rule.",
    result: "Zero cross-tenant data access vulnerabilities in post-audit scan. 100% of new queries automatically scoped. Security audit passed by enterprise client security team. No performance regression from RLS.",
    metrics: "0 vulnerabilities found post-audit, 100% query coverage, enterprise security audit passed",
    shortVersion: "Implemented PostgreSQL RLS and ORM-level tenant guards to eliminate cross-tenant data leak risk, passing enterprise security audit.",
    longVersion: "A security review at Prospecta revealed that some database queries were missing tenant_id WHERE clauses, creating a potential data isolation risk in our multi-tenant platform. I designed a two-layer defense: PostgreSQL Row Level Security policies as a database-enforced guarantee, and a custom ORM query interceptor that automatically injects tenant context into every query. I also wrote a custom ESLint-style SQL rule to flag any raw queries missing tenant scoping. We ran a full audit across 300+ queries. The enterprise client's security team ran penetration tests post-fix and confirmed zero vulnerabilities.",
    tags: ["architecture", "reliability", "performance"],
  },
  {
    id: uid(),
    title: "Real-Time Inventory Sync with External ERP",
    problem: "Inventory data between Prospecta's platform and suppliers' ERP systems was synced via nightly batch jobs, causing stale data (up to 24h lag). This led to overselling and customer-facing order failures.",
    action: "Designed a webhook-based real-time sync system. Suppliers register webhook endpoints; Prospecta pushes inventory deltas on every change. Built an idempotency layer using event IDs to handle delivery retries safely. Added exponential backoff for failed deliveries and a dashboard for monitoring sync health.",
    result: "Inventory lag reduced from 24 hours to under 30 seconds for webhook-enabled suppliers. Overselling incidents dropped by 85%. 12 out of 15 key suppliers onboarded within 3 weeks.",
    metrics: "24h → <30s sync lag, 85% reduction in overselling, 12/15 key suppliers onboarded in 3 weeks",
    shortVersion: "Replaced 24h batch inventory sync with real-time webhooks, reducing lag to <30s and cutting overselling incidents by 85%.",
    longVersion: "Prospecta's inventory sync was a batch job that ran nightly, leaving inventory data up to 24 hours stale. This caused overselling and customer-facing order failures. I designed a real-time webhook delivery system: Prospecta pushes deltas to registered supplier endpoints within seconds of any inventory change. I built an idempotency layer using event IDs stored in Redis to prevent double-processing on retries. Delivery failures trigger exponential backoff with alerting. I also built an internal dashboard for the ops team to monitor sync health. The result was a reduction in inventory lag from 24 hours to under 30 seconds for participating suppliers.",
    tags: ["architecture", "reliability", "async processing"],
  },
];

// ─── DSA PROBLEMS ──────────────────────────────────────────────────────────────
const dsaProblems: DSAProblem[] = [
  {
    id: uid(),
    name: "Two Sum",
    topics: ["Arrays"],
    difficulty: "Easy",
    platform: "LeetCode",
    solved: true,
    timeTaken: 15,
    pattern: "Hashmap",
    mistakes: "",
    url: "https://leetcode.com/problems/two-sum"
  },
  {
    id: uid(),
    name: "Best Time to Buy and Sell Stock",
    topics: ["Arrays"],
    difficulty: "Easy",
    platform: "LeetCode",
    solved: true,
    timeTaken: 20,
    pattern: "Sliding Window",
    mistakes: "",
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock"
  },
  {
    id: uid(),
    name: "Longest Substring Without Repeating Characters",
    topics: ["Strings"],
    difficulty: "Medium",
    platform: "LeetCode",
    solved: true,
    timeTaken: 35,
    pattern: "Sliding Window",
    mistakes: "Forgot to update left pointer correctly",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters"
  },
  {
    id: uid(),
    name: "Container With Most Water",
    topics: ["Arrays"],
    difficulty: "Medium",
    platform: "LeetCode",
    solved: true,
    timeTaken: 30,
    pattern: "Two Pointer",
    mistakes: "",
    url: "https://leetcode.com/problems/container-with-most-water"
  },
  {
    id: uid(),
    name: "Valid Parentheses",
    topics: ["Stack"],
    difficulty: "Easy",
    platform: "LeetCode",
    solved: true,
    timeTaken: 12,
    pattern: "Stack",
    mistakes: "",
    url: "https://leetcode.com/problems/valid-parentheses"
  },
  {
    id: uid(),
    name: "Binary Search",
    topics: ["Binary Search"],
    difficulty: "Easy",
    platform: "LeetCode",
    solved: true,
    timeTaken: 18,
    pattern: "Binary Search",
    mistakes: "",
    url: "https://leetcode.com/problems/binary-search"
  },
  {
    id: uid(),
    name: "Number of Islands",
    topics: ["Graphs"],
    difficulty: "Medium",
    platform: "LeetCode",
    solved: false,
    timeTaken: 0,
    pattern: "DFS/BFS",
    mistakes: "",
    url: "https://leetcode.com/problems/number-of-islands"
  },
  {
    id: uid(),
    name: "Merge K Sorted Lists",
    topics: ["Heap"],
    difficulty: "Hard",
    platform: "LeetCode",
    solved: false,
    timeTaken: 0,
    pattern: "Heap",
    mistakes: "",
    url: "https://leetcode.com/problems/merge-k-sorted-lists"
  },
  {
    id: uid(),
    name: "Coin Change",
    topics: ["Dynamic Programming"],
    difficulty: "Medium",
    platform: "LeetCode",
    solved: false,
    timeTaken: 0,
    pattern: "DP - Unbounded Knapsack",
    mistakes: "",
    url: "https://leetcode.com/problems/coin-change"
  },
  {
    id: uid(),
    name: "Lowest Common Ancestor of BST",
    topics: ["Trees"],
    difficulty: "Medium",
    platform: "LeetCode",
    solved: true,
    timeTaken: 25,
    pattern: "Tree Traversal",
    mistakes: "",
    url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree"
  },
];

// ─── SYSTEM DESIGN TOPICS ──────────────────────────────────────────────────────
const sdTopics: SystemDesignTopic[] = [
  {
    id: uid(),
    title: "URL Shortener (like bit.ly)",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "exercise"
  },
  {
    id: uid(),
    title: "Notification Service (Email/SMS/Push)",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "exercise"
  },
  {
    id: uid(),
    title: "Rate Limiter",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "exercise"
  },
  {
    id: uid(),
    title: "Pastebin",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "exercise"
  },
  {
    id: uid(),
    title: "File Upload Service (like S3)",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "exercise"
  },
  {
    id: uid(),
    title: "Analytics Pipeline",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "exercise"
  },
  {
    id: uid(),
    title: "Load Balancing & CDN",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "core"
  },
  {
    id: uid(),
    title: "Caching Strategies (Redis, Memcached)",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "core"
  },
  {
    id: uid(),
    title: "Database Sharding & Replication",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "core"
  },
  {
    id: uid(),
    title: "Message Queues (Kafka, RabbitMQ)",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "core"
  },
  {
    id: uid(),
    title: "CAP Theorem & Consistency Models",
    status: "not-started",
    tradeoffs: "",
    notes: "",
    diagramRef: "",
    category: "core"
  },
];

// ─── APPLICATIONS ──────────────────────────────────────────────────────────────
const applications: Application[] = [
  {
    id: uid(),
    company: "Stripe",
    role: "Senior Backend Engineer",
    location: "Remote (India)",
    comp: "₹45-55 LPA",
    status: "wishlist",
    notes: "Strong infra team. Focus on payment systems SD.",
    referral: "",
    dates: [],
    createdAt: new Date().toISOString()
  },
  {
    id: uid(),
    company: "Razorpay",
    role: "Software Engineer II - Backend",
    location: "Bangalore",
    comp: "₹35-45 LPA",
    status: "applied",
    notes: "Applied through company site. Backend platform team.",
    referral: "",
    dates: [],
    createdAt: new Date().toISOString()
  },
  {
    id: uid(),
    company: "Zepto",
    role: "Senior SDE - Backend",
    location: "Mumbai",
    comp: "₹30-40 LPA",
    status: "referred",
    notes: "Referred by college friend Arjun who works on the data team.",
    referral: "Arjun Kumar (Data Engineer)",
    dates: [],
    createdAt: new Date().toISOString()
  },
];

// ─── MOCK INTERVIEWS ───────────────────────────────────────────────────────────
const mockInterviews: MockInterview[] = [
  {
    id: uid(),
    type: "DSA",
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    score: 6,
    wrongPoints: ["Couldn't optimize brute force to O(n log n)", "Forgot edge case: empty array"],
    improvements: "Practice more heap problems. Review sorting-based optimizations.",
    interviewer: "Pramp"
  },
];

// ─── NOTES ─────────────────────────────────────────────────────────────────────
const notes: Note[] = [
  {
    id: uid(),
    title: "Two Pointer Pattern Notes",
    content: "## Two Pointer\n\nUse when:\n- Array is sorted or you need to find a pair\n- In-place array manipulation\n\n**Template:**\n```\nleft = 0, right = n-1\nwhile left < right:\n  if condition: return\n  elif too small: left++\n  else: right--\n```\n\nProblems: Two Sum II, Container With Most Water, 3Sum",
    category: "dsa",
    tags: ["arrays", "two-pointer"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uid(),
    title: "Stripe Interview Tips",
    content: "- Heavy focus on distributed systems\n- Expect 2 DSA rounds + 1 system design + 1 behavioral\n- System design usually around payments, reliability, or API design\n- Be ready to discuss failure handling and idempotency",
    category: "company",
    tags: ["stripe", "interview-prep"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

// ─── RESOURCES ────────────────────────────────────────────────────────────────
const resources: Resource[] = [
  {
    id: uid(),
    title: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    type: "repo",
    category: "system-design",
    tags: ["architecture", "fundamentals"],
    notes: "The gold standard for system design interview prep. Includes diagrams and deep dives.",
    isPinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: uid(),
    title: "NeetCode 150",
    url: "https://neetcode.io/practice",
    type: "tool",
    category: "dsa",
    tags: ["patterns", "leetcode"],
    notes: "Great categorized list of LeetCode problems with video explanations.",
    isPinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: uid(),
    title: "Tech Interview Handbook",
    url: "https://www.techinterviewhandbook.org/behavioral-interview-questions/",
    type: "article",
    category: "behavioral",
    tags: ["soft-skills", "star-format"],
    notes: "Excellent resource for behavioral interview preparation and common questions.",
    isPinned: false,
    createdAt: new Date().toISOString()
  },
];

// ─── FULL SEED STATE ───────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

export const seedState: AppState = {
  weeks,
  dayLogs: [
    {
      id: uid(),
      date: yesterday,
      focusArea: "DSA",
      plannedTime: 3,
      completedTime: 2.5,
      reflection: "Good session on two-pointer problems. Need to revisit sliding window edge cases."
    },
    { id: uid(), date: today, focusArea: "Story Bank", plannedTime: 2, completedTime: 0, reflection: "" },
  ],
  notes,
  storyCards,
  dsaProblems,
  sdTopics,
  applications,
  mockInterviews,
  resources,
  studyStreak: [yesterday, today],
  startDate: today,
};

export const emptyState: AppState = {
  weeks,
  dayLogs: [],
  notes: [],
  storyCards: [],
  dsaProblems: [],
  sdTopics: sdTopics.map(t => ({ ...t, status: "not-started", tradeoffs: "", notes: "" })),
  applications: [],
  mockInterviews: [],
  resources: [],
  studyStreak: [],
  startDate: today,
};
