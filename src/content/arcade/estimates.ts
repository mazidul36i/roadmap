// Estimate It: back-of-the-envelope questions. Within 2× of the answer scores.

export interface EstimateItem {
  id: string;
  prompt: string;
  /** Unit the answer is expressed in (shown next to the input). */
  unit: string;
  answer: number;
  explanation: string;
}

export const ESTIMATE_ITEMS: EstimateItem[] = [
  { id: "est-1", prompt: "Seconds in a day", unit: "seconds", answer: 86_400, explanation: "24 × 3,600 = 86,400. Round to 10⁵ for quick maths." },
  {
    id: "est-2",
    prompt: "Average requests per second from 100 M daily users making 10 requests each",
    unit: "req/s",
    answer: 11_574,
    explanation: "1 B requests ÷ 86,400 s ≈ 11.6K/s. Plan for 2–3× that at peak.",
  },
  {
    id: "est-3",
    prompt: "Storage per year for 50 M photo uploads a day at 200 KB each",
    unit: "TB",
    answer: 3_650,
    explanation: "50 M × 200 KB = 10 TB a day; × 365 ≈ 3.65 PB, or 3,650 TB (before replication).",
  },
  {
    id: "est-4",
    prompt: "Memory to hold 1 billion 64-bit integers",
    unit: "GB",
    answer: 8,
    explanation: "8 bytes × 10⁹ = 8 GB.",
  },
  {
    id: "est-5",
    prompt: "Average writes per second for 500 M posts a day",
    unit: "writes/s",
    answer: 5_787,
    explanation: "500 M ÷ 86,400 ≈ 5.8K/s.",
  },
  {
    id: "est-6",
    prompt: "Average egress to serve 1 M video views a day at 50 MB each",
    unit: "MB/s",
    answer: 579,
    explanation: "50 TB a day ÷ 86,400 s ≈ 580 MB/s (about 4.6 Gbps).",
  },
  {
    id: "est-7",
    prompt: "How many 1 KB records fit in 16 GB of RAM",
    unit: "records",
    answer: 16_000_000,
    explanation: "16 × 10⁹ ÷ 10³ = 16 M (ignoring object overhead, which in Java can double it).",
  },
  {
    id: "est-8",
    prompt: "Read QPS for a URL shortener with 100 M new links a month and 100:1 reads to writes",
    unit: "reads/s",
    answer: 3_858,
    explanation: "100 M ÷ 2.6 M seconds ≈ 39 writes/s; × 100 ≈ 3.9K reads/s on average.",
  },
  {
    id: "est-9",
    prompt: "Servers needed for 120K QPS if one handles 2,000 QPS at the latency target",
    unit: "servers",
    answer: 60,
    explanation: "120,000 ÷ 2,000 = 60, before headroom and redundancy (so ~80–90 in practice).",
  },
  {
    id: "est-10",
    prompt: "Days to copy 1 PB over a fully used 10 Gbps link",
    unit: "days",
    answer: 9.3,
    explanation: "8 × 10¹⁵ bits ÷ 10¹⁰ bit/s = 800,000 s ≈ 9.3 days. Sometimes shipping disks wins.",
  },
  {
    id: "est-11",
    prompt: "Cache size to hold the hottest 20% of 500 M user profiles at 1 KB each",
    unit: "GB",
    answer: 100,
    explanation: "100 M × 1 KB = 100 GB: a handful of cache nodes.",
  },
  {
    id: "est-12",
    prompt: "Logs stored over 10 years at 50 GB a day",
    unit: "TB",
    answer: 182.5,
    explanation: "50 GB × 3,650 days = 182.5 TB.",
  },
  {
    id: "est-13",
    prompt: "Sequential round trips per second over a link with 150 ms round-trip time",
    unit: "per second",
    answer: 6.7,
    explanation: "1 ÷ 0.15 s ≈ 6.7. Latency, not bandwidth, caps chatty protocols.",
  },
  {
    id: "est-14",
    prompt: "Random seeks per second on a spinning disk with ~10 ms seek time",
    unit: "seeks/s",
    answer: 100,
    explanation: "1 ÷ 0.01 s = 100 IOPS. SSDs do tens of thousands.",
  },
  {
    id: "est-15",
    prompt: "Insert rate needed to load 1 billion rows in one hour",
    unit: "rows/s",
    answer: 277_778,
    explanation: "10⁹ ÷ 3,600 ≈ 278K rows/s: you need batching and parallelism.",
  },
  {
    id: "est-16",
    prompt: "Number of 4 KB pages in 1 GB",
    unit: "pages",
    answer: 262_144,
    explanation: "2³⁰ ÷ 2¹² = 2¹⁸ = 262,144.",
  },
  {
    id: "est-17",
    prompt: "Kafka partitions for 300 MB/s of ingest if each partition sustains 10 MB/s",
    unit: "partitions",
    answer: 30,
    explanation: "300 ÷ 10 = 30, then round up for headroom and consumer parallelism.",
  },
  {
    id: "est-18",
    prompt: "Monthly cost of 200 TB in object storage at $0.02 per GB-month",
    unit: "USD",
    answer: 4_000,
    explanation: "200,000 GB × $0.02 = $4,000 a month (requests and egress extra).",
  },
  {
    id: "est-19",
    prompt: "Average reads per second of a page viewed 864 M times a day",
    unit: "reads/s",
    answer: 10_000,
    explanation: "864 M ÷ 86,400 = 10,000 exactly. A handy anchor: 1 M a day ≈ 12 per second.",
  },
  {
    id: "est-20",
    prompt: "Hours to process 1 TB at 100 MB/s on one machine",
    unit: "hours",
    answer: 2.8,
    explanation: "10⁶ MB ÷ 100 MB/s = 10,000 s ≈ 2.8 hours.",
  },
  {
    id: "est-21",
    prompt: "Total IPv4 addresses",
    unit: "billion",
    answer: 4.3,
    explanation: "2³² ≈ 4.29 billion.",
  },
  {
    id: "est-22",
    prompt: "Distinct 7-character base62 short codes",
    unit: "trillion",
    answer: 3.5,
    explanation: "62⁷ ≈ 3.52 × 10¹².",
  },
  {
    id: "est-23",
    prompt: "Time to send 1 MB over a 1 Gbps network (ignoring latency)",
    unit: "ms",
    answer: 8,
    explanation: "8 × 10⁶ bits ÷ 10⁹ bit/s = 8 ms.",
  },
  {
    id: "est-24",
    prompt: "Seconds in a year",
    unit: "million",
    answer: 31.5,
    explanation: "365 × 86,400 ≈ 31.5 M. Handy: π × 10⁷.",
  },
  {
    id: "est-25",
    prompt: "Concurrent WebSocket connections for 30% of 100 M daily users online at peak",
    unit: "connections",
    answer: 30_000_000,
    explanation: "30 M connections; at ~50K per gateway that's ~600 nodes.",
  },
];

/** Parses "12k", "3.5M", "2,000", "1e6" into a number. */
export function parseEstimate(raw: string): number | null {
  const m = raw
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .match(/^(-?\d*\.?\d+(?:e[+-]?\d+)?)([kmbt])?$/i);
  if (!m) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[(m[2] ?? "").toLowerCase() as "k" | "m" | "b" | "t"] ?? 1;
  const n = Number(m[1]) * mult;
  return Number.isFinite(n) ? n : null;
}

/** "correct" within 2×, "close" within 4×. */
export function gradeEstimate(guess: number, answer: number): "correct" | "close" | "off" {
  if (guess <= 0 || answer <= 0) return guess === answer ? "correct" : "off";
  const ratio = Math.max(guess / answer, answer / guess);
  return ratio <= 2 ? "correct" : ratio <= 4 ? "close" : "off";
}
