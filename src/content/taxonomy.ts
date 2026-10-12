// Single source of truth for shared vocabularies (topics, tags, tracks).
// Pure data: no React imports, so it is safe to use from tests and lib code.

import type { AppStatus, DSADifficulty, DSAPlatform, MockType, ResourceType, TrackId } from "@app-types/index";

// ─── Tracks ────────────────────────────────────────────────────────────────────

export interface TrackMeta {
  id: TrackId;
  title: string;
  short: string;
  tagline: string;
  /** CSS custom property holding the track colour. */
  colorVar: string;
}

export const TRACKS: TrackMeta[] = [
  { id: "dsa", title: "DSA Pattern Atlas", short: "DSA", tagline: "Recognise the pattern, then the code writes itself.", colorVar: "--track-dsa" },
  { id: "system-design", title: "System Design", short: "System Design", tagline: "Trade-offs, estimates, and designs you can defend.", colorVar: "--track-system-design" },
  { id: "java", title: "Java, Spring & the JVM", short: "Java & Spring", tagline: "The internals interviewers love to poke at.", colorVar: "--track-java" },
  { id: "behavioral", title: "Behavioral", short: "Behavioral", tagline: "Stories that land, for every competency.", colorVar: "--track-behavioral" },
  { id: "devops", title: "DevOps & Delivery", short: "DevOps", tagline: "CI/CD, containers and Kubernetes, minus the hand-waving.", colorVar: "--track-devops" },
  { id: "ai", title: "AI Engineering", short: "AI Eng", tagline: "LLMs, RAG and Spring AI for backend engineers.", colorVar: "--track-ai" },
];

export const TRACK_BY_ID: Record<TrackId, TrackMeta> = Object.fromEntries(TRACKS.map(t => [t.id, t])) as Record<TrackId, TrackMeta>;

export const ALL_TRACK_IDS: TrackId[] = TRACKS.map(t => t.id);

// ─── DSA ───────────────────────────────────────────────────────────────────────

export const DSA_TOPICS = [
  "Arrays", "Strings", "Hashmaps", "Stack", "Queue", "Linked List",
  "Trees", "BST", "Graphs", "Heap", "Binary Search", "Two Pointer",
  "Sliding Window", "Dynamic Programming", "Backtracking", "Trie",
  "Greedy", "Math", "Intervals", "Bit Manipulation", "Union Find", "Prefix Sum",
] as const;

export type DSATopic = (typeof DSA_TOPICS)[number];

export const DIFFICULTIES: DSADifficulty[] = ["Easy", "Medium", "Hard"];
export const PLATFORMS: DSAPlatform[] = ["LeetCode", "HackerRank", "CodeForces", "InterviewBit", "Other"];

/** Semantic tone per difficulty, for badges. Always render the label too. */
export const DIFFICULTY_TONE: Record<DSADifficulty, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

/** LeetCode topic tag → Forge topic. */
export const LEETCODE_TAG_MAP: Record<string, DSATopic> = {
  "Array": "Arrays",
  "Matrix": "Arrays",
  "String": "Strings",
  "String Matching": "Strings",
  "Hash Table": "Hashmaps",
  "Counting": "Hashmaps",
  "Stack": "Stack",
  "Monotonic Stack": "Stack",
  "Queue": "Queue",
  "Monotonic Queue": "Queue",
  "Linked List": "Linked List",
  "Tree": "Trees",
  "Binary Tree": "Trees",
  "Binary Search Tree": "BST",
  "Graph": "Graphs",
  "Depth-First Search": "Graphs",
  "Breadth-First Search": "Graphs",
  "Topological Sort": "Graphs",
  "Shortest Path": "Graphs",
  "Union Find": "Union Find",
  "Heap (Priority Queue)": "Heap",
  "Priority Queue": "Heap",
  "Binary Search": "Binary Search",
  "Two Pointers": "Two Pointer",
  "Sliding Window": "Sliding Window",
  "Dynamic Programming": "Dynamic Programming",
  "Memoization": "Dynamic Programming",
  "Backtracking": "Backtracking",
  "Recursion": "Backtracking",
  "Trie": "Trie",
  "Greedy": "Greedy",
  "Math": "Math",
  "Number Theory": "Math",
  "Bit Manipulation": "Bit Manipulation",
  "Prefix Sum": "Prefix Sum",
  "Sorting": "Arrays",
};

/** Maps LeetCode tag names to Forge topics, de-duplicated, falling back to "Arrays". */
export function mapLeetCodeTags(tags: string[]): DSATopic[] {
  const mapped = new Set<DSATopic>();
  for (const tag of tags) {
    const direct = LEETCODE_TAG_MAP[tag];
    if (direct) {
      mapped.add(direct);
      continue;
    }
    const fuzzy = DSA_TOPICS.find(t => tag.toLowerCase().includes(t.toLowerCase()));
    if (fuzzy) mapped.add(fuzzy);
  }
  return mapped.size ? [...mapped] : ["Arrays"];
}

// ─── Stories / behavioral ─────────────────────────────────────────────────────

export const STORY_TAGS = [
  "performance", "search", "async processing", "data pipeline", "architecture", "reliability", "optimization",
  "leadership", "ownership", "conflict", "failure", "ambiguity", "collaboration", "mentoring", "customer impact", "deadline",
] as const;

// ─── Career ───────────────────────────────────────────────────────────────────

export const APP_STATUSES: { key: AppStatus; label: string }[] = [
  { key: "wishlist", label: "Wishlist" },
  { key: "applied", label: "Applied" },
  { key: "referred", label: "Referred" },
  { key: "interview-scheduled", label: "Interview scheduled" },
  { key: "technical-round", label: "Technical round" },
  { key: "system-design-round", label: "System design round" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];

export const APP_STATUS_LABEL: Record<AppStatus, string> = Object.fromEntries(
  APP_STATUSES.map(s => [s.key, s.label]),
) as Record<AppStatus, string>;

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const FOCUS_AREAS = ["DSA", "System Design", "Java & Spring", "Story Bank", "Applications", "Mock Interviews", "DevOps", "AI Engineering", "Resume", "Networking", "Other"];

export const MOCK_TYPES: MockType[] = ["DSA", "System Design", "Behavioral", "Java", "Resume/Story"];

export const RESOURCE_TYPES: ResourceType[] = ["article", "video", "pdf", "course", "tool", "repo"];

export const RESOURCE_CATEGORIES = [
  { key: "dsa", label: "DSA" },
  { key: "system-design", label: "System Design" },
  { key: "behavioral", label: "Behavioral" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "general", label: "General" },
] as const;
