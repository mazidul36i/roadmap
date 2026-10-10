import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Briefcase,
  Code2,
  Flame,
  Gamepad2,
  GraduationCap,
  Layers,
  Library,
  Map as MapIcon,
  Mic,
  NotebookPen,
  Network,
  Settings,
  StickyNote,
  Trophy,
  Waypoints,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should highlight this item. */
  match?: string[];
  /** Short label for the mobile bottom bar. */
  short?: string;
  badge?: "reviewDue";
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    items: [{ to: "/", label: "Today", short: "Today", icon: Flame }],
  },
  {
    id: "learn",
    label: "Learn",
    items: [
      { to: "/learn", label: "Tracks", short: "Learn", icon: GraduationCap, match: ["/learn"] },
      { to: "/learn/dsa", label: "Pattern Atlas", icon: Waypoints },
      { to: "/learn/system-design", label: "System Design", icon: Network },
    ],
  },
  {
    id: "train",
    label: "Train",
    items: [
      { to: "/review", label: "Review", short: "Review", icon: Layers, badge: "reviewDue" },
      { to: "/arcade", label: "Arcade", icon: Gamepad2 },
    ],
  },
  {
    id: "practice",
    label: "Practice",
    items: [
      { to: "/practice/problems", label: "Problems", short: "Practice", icon: Code2 },
      { to: "/practice/mocks", label: "Mock Interviews", icon: Mic },
      { to: "/practice/stories", label: "Stories", icon: BookOpenText },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      { to: "/plan", label: "Campaign", icon: MapIcon },
      { to: "/journal", label: "Journal", icon: NotebookPen },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [{ to: "/career", label: "Pipeline", icon: Briefcase }],
  },
  {
    id: "library",
    label: "Library",
    items: [
      { to: "/notes", label: "Notes", icon: StickyNote },
      { to: "/resources", label: "Resources", icon: Library },
    ],
  },
];

export const FOOTER_NAV: NavItem[] = [
  { to: "/profile", label: "Profile & Trophies", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
];

/** Five destinations for the mobile bottom bar (the fifth, "More", opens the full nav). */
export const BOTTOM_NAV: NavItem[] = [
  NAV_GROUPS[0].items[0],
  NAV_GROUPS[1].items[0],
  NAV_GROUPS[2].items[0],
  NAV_GROUPS[3].items[0],
];

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap(g => g.items), ...FOOTER_NAV];

/** Most specific nav item for a path (longest matching prefix wins). */
export function activeNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  let bestLen = -1;
  for (const item of ALL_NAV_ITEMS) {
    const prefixes = [item.to, ...(item.match ?? [])];
    for (const p of prefixes) {
      const hit = p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`);
      if (hit && p.length > bestLen) {
        best = item;
        bestLen = p.length;
      }
    }
  }
  return best;
}

/** Old URLs → new homes. `:id` and the query string carry over. */
export const LEGACY_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: "/dsa", to: "/practice/problems" },
  { from: "/dsa/:id", to: "/practice/problems/:id" },
  { from: "/dsa-patterns", to: "/learn/dsa" },
  { from: "/sysdesign", to: "/learn/system-design" },
  { from: "/sysdesign/:id", to: "/learn/system-design/topics/:id" },
  { from: "/applications", to: "/career" },
  { from: "/applications/:id", to: "/career/:id" },
  { from: "/mocks", to: "/practice/mocks" },
  { from: "/mocks/:id", to: "/practice/mocks/:id" },
  { from: "/stories", to: "/practice/stories" },
  { from: "/stories/:id", to: "/practice/stories/:id" },
  { from: "/planner", to: "/journal" },
  { from: "/roadmap", to: "/plan" },
  { from: "/focus", to: "/session" },
];
