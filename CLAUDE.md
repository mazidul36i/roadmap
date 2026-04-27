# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server at localhost:5173
npm run build      # TypeScript check + Vite build → dist/
npm run preview    # Preview production build locally
```

There are no tests. TypeScript strict mode serves as the primary correctness check — `npm run build` will catch type errors.

## Environment

Copy `.env.example` (or create `.env`) with:
```
VITE_GEMINI_API_KEY=<your Gemini API key>
```

Firebase config is in [src/lib/firebase.ts](src/lib/firebase.ts) — it connects to the `gs-interview-prep` Firestore project.

## Architecture

**React 19 + TypeScript + Vite** SPA. No SSR, no server-side code.

### State & Persistence

All app data flows through a single `useReducer` in [src/context/AppContext.tsx](src/context/AppContext.tsx). The reducer handles 60+ action types for CRUD on every entity. State is persisted to **Firestore** (`users/{uid}`) with a debounced 1-second write.

On login, Firestore state is loaded into the reducer. New users go through the onboarding flow in [src/components/SetupChoice.tsx](src/components/SetupChoice.tsx) which seeds 8 weeks of roadmap data from [src/data/seed.ts](src/data/seed.ts).

### Key Contexts

| Context | Purpose |
|---------|---------|
| `AppContext` | Global app state + dispatch |
| `AuthContext` | Firebase auth user object |
| `ThemeContext` | `data-theme` attribute toggle (dark default) |
| `ConfirmationContext` | Reusable confirm modal |

Auth is required — unauthenticated users see `LoginPage.tsx` (Google Sign-In). After login, `needsOnboarding` in `AppContext` gates the `SetupChoice` flow before the main shell renders.

### Data Model

All types are in [src/types/index.ts](src/types/index.ts). Top-level `AppState` contains:
- `weeks: Week[]` — 8-week roadmap with tasks
- `dayLogs: DayLog[]` — daily study sessions
- `notes: Note[]` — rich-text notes with categories
- `storyCards: StoryCard[]` — STAR-format interview stories
- `dsaProblems: DSAProblem[]` — LeetCode/Codeforces/HackerRank/etc. log
- `sdTopics: SystemDesignTopic[]` — system design exercises (`category: "core" | "exercise"`)
- `applications: Application[]` — job pipeline (Kanban) with `InterviewDate[]` per entry
- `mockInterviews: MockInterview[]` — mock session log (`type: "DSA" | "System Design" | "Resume/Story"`)
- `resources: Resource[]` — bookmarked learning materials (`type: "article" | "video" | "pdf" | "course" | "tool" | "repo"`)
- `studyStreak: string[]` — ISO date strings
- `startDate: string` — start of the 8-week plan
- `aiEnabled?: boolean` — whether AI features are enabled for this user
- `theme?: "dark" | "light"` — persisted theme preference

Most entities support a `linkedNoteIds?: string[]` field for cross-linking to notes.

### Routing & Layout

[src/App.tsx](src/App.tsx) defines React Router v7 routes. All pages share a fixed sidebar (`Sidebar.tsx`, 240px) and topbar (`TopBar.tsx`, 60px). Pages live in [src/pages/](src/pages/).

Routes:

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/roadmap` | Roadmap |
| `/planner` | Daily Planner |
| `/notes` | Notes |
| `/stories`, `/stories/:id` | Story Bank + StoryDetail |
| `/dsa`, `/dsa/:id` | DSA Tracker + DSAProblemDetail |
| `/sysdesign`, `/sysdesign/:id` | System Design + SystemDesignDetail |
| `/applications`, `/applications/:id` | Applications (Kanban) + ApplicationDetail |
| `/mocks`, `/mocks/:id` | Mock Interviews + MockInterviewDetail |
| `/resources`, `/resources/:id` | Resource Library + ResourceDetail |
| `/focus` | Focus Mode (full-screen, no shell chrome) |

Notable pages/components:
- [DetailPages.tsx](src/pages/DetailPages.tsx) — workspace views for individual entities (stories, applications, DSA, mocks, resources, system design)
- [Applications.tsx](src/pages/Applications.tsx) — Kanban board using `@dnd-kit`
- [DSATracker.tsx](src/pages/DSATracker.tsx) — problem log with Recharts visualizations
- [InterviewTimer.tsx](src/components/InterviewTimer.tsx) — floating global timer rendered outside the shell in `App.tsx`

### AI Integration

[src/lib/gemini.ts](src/lib/gemini.ts) exports `generateText(prompt)` and `generateJSON<T>(prompt, schema)` helpers using `@google/generative-ai`. Requires `VITE_GEMINI_API_KEY` in `.env`. Features using AI: Story Reviewer, DSA hint generator, note summarizer, tag extractor. AI features are gated by `AppState.aiEnabled`.

### Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:
- `@components/*` → `src/components/*`
- `@context/*` → `src/context/*`
- `@data/*` → `src/data/*`
- `@lib/*` → `src/lib/*`
- `@pages/*` → `src/pages/*`
- `@app-types/*` → `src/types/*`

### Styling

Single global stylesheet at [src/index.css](src/index.css) (~54KB). Uses CSS custom properties for theming — no CSS-in-JS, no Tailwind. Theme is toggled via `data-theme="light"` on `<html>`. Dark mode is the default. Framer Motion handles page transitions and component animations.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | For AI features | Google Gemini API key |

Firebase config is hardcoded in [src/lib/firebase.ts](src/lib/firebase.ts) for the `gs-interview-prep` project. All persistence goes through Firestore — there is no localStorage fallback.

## Conventions

- Entity IDs are generated with `crypto.randomUUID()`
- Add new reducer actions to `AppContext.tsx` using the existing pattern: discriminated union action type → `AppState` return
- New pages go in `src/pages/`, registered in `App.tsx`, and linked in `Sidebar.tsx`
- Firebase writes are handled exclusively inside `AppContext.tsx`; pages only call `dispatch`
- Detail/workspace views for entities go in `DetailPages.tsx` as named exports, then imported in `App.tsx`
- Cross-entity linking uses `linkedNoteIds?: string[]` — entities can reference notes by ID
