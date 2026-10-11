import { doc, getDoc, setDoc } from "firebase/firestore";
import { Brain, Coffee, Network, Users, type LucideIcon } from "lucide-react";
import type { MockType } from "@app-types/index";
import { db } from "@lib/firebase";

export type AiMockType = "DSA" | "System Design" | "Behavioral" | "Java";
export type MockDifficulty = "easy" | "medium" | "hard";

export interface MockTypeInfo {
  type: AiMockType;
  title: string;
  blurb: string;
  icon: LucideIcon;
  color: string;
  defaultMinutes: number;
  scratchLabel: string;
}

export const AI_MOCK_TYPES: MockTypeInfo[] = [
  {
    type: "DSA",
    title: "Coding",
    blurb: "A data structures and algorithms problem: clarify, plan, code, test, analyse.",
    icon: Brain,
    color: "var(--track-dsa)",
    defaultMinutes: 45,
    scratchLabel: "Code and notes",
  },
  {
    type: "System Design",
    title: "System design",
    blurb: "Design a system end to end and defend your trade-offs under follow-ups.",
    icon: Network,
    color: "var(--track-system-design)",
    defaultMinutes: 45,
    scratchLabel: "Design notes",
  },
  {
    type: "Behavioral",
    title: "Behavioral",
    blurb: "Competency questions with follow-ups that probe ownership and impact.",
    icon: Users,
    color: "var(--track-behavioral)",
    defaultMinutes: 30,
    scratchLabel: "STAR notes",
  },
  {
    type: "Java",
    title: "Java deep dive",
    blurb: "JVM, concurrency, collections and Spring internals, the way a senior panel asks.",
    icon: Coffee,
    color: "var(--track-java)",
    defaultMinutes: 30,
    scratchLabel: "Notes and snippets",
  },
];

export const MOCK_TYPE_INFO = Object.fromEntries(AI_MOCK_TYPES.map(t => [t.type, t])) as Record<AiMockType, MockTypeInfo>;

/** All types a manually logged mock can have (includes the legacy one). */
export const ALL_MOCK_TYPES: MockType[] = ["DSA", "System Design", "Behavioral", "Java", "Resume/Story"];

export const COMPANY_STYLES = ["Google", "Amazon", "Meta", "Microsoft", "Goldman Sachs", "Stripe", "Startup"];
export const DURATIONS = [20, 30, 45, 60];

export const MOCK_COLOR: Record<MockType, string> = {
  DSA: "var(--track-dsa)",
  "System Design": "var(--track-system-design)",
  Behavioral: "var(--track-behavioral)",
  Java: "var(--track-java)",
  "Resume/Story": "var(--track-behavioral)",
};

export interface MockSetup {
  type: AiMockType;
  difficulty: MockDifficulty;
  durationMinutes: number;
  company?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LiveMock {
  id: string;
  setup: MockSetup;
  messages: ChatTurn[];
  scratchpad: string;
  startedAt: number;
}

export interface Transcript {
  setup: MockSetup;
  messages: ChatTurn[];
  scratchpad: string;
  startedAt: number;
  endedAt: number;
}

/** Contract limits: 80 messages, 8000 chars each. */
export const MAX_MESSAGES = 80;
export const MAX_MESSAGE_CHARS = 6000;
export const END_MARKER = "— End of interview —";

const LIVE_KEY = "forge:mock:live";
const LOCAL_TRANSCRIPTS = "forge:mock:transcripts";

export function loadLive(): LiveMock | null {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    return raw ? (JSON.parse(raw) as LiveMock) : null;
  } catch {
    return null;
  }
}

export function saveLive(live: LiveMock | null) {
  try {
    if (live) localStorage.setItem(LIVE_KEY, JSON.stringify(live));
    else localStorage.removeItem(LIVE_KEY);
  } catch {
    // Storage full or blocked: the interview still works, it just won't survive a reload.
  }
}

function localTranscripts(): Record<string, Transcript> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TRANSCRIPTS) ?? "{}") as Record<string, Transcript>;
  } catch {
    return {};
  }
}

/** Saves to Firestore (users/{uid}/mocks/{id}) and keeps a local copy of the last few. */
export async function saveTranscript(userId: string, mockId: string, transcript: Transcript): Promise<boolean> {
  try {
    const all = localTranscripts();
    all[mockId] = transcript;
    const keep = Object.entries(all)
      .sort((a, b) => b[1].endedAt - a[1].endedAt)
      .slice(0, 5);
    localStorage.setItem(LOCAL_TRANSCRIPTS, JSON.stringify(Object.fromEntries(keep)));
  } catch {
    // ignore
  }
  try {
    await setDoc(doc(db, "users", userId, "mocks", mockId), transcript);
    return true;
  } catch {
    return false;
  }
}

export async function loadTranscript(userId: string, mockId: string): Promise<Transcript | null> {
  try {
    const snap = await getDoc(doc(db, "users", userId, "mocks", mockId));
    if (snap.exists()) return snap.data() as Transcript;
  } catch {
    // fall through to the local copy
  }
  return localTranscripts()[mockId] ?? null;
}

export function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}
