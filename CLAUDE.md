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

All app data flows through a single `useReducer` in [src/context/AppContext.tsx](src/context/AppContext.tsx). The reducer handles 60+ action types for CRUD on every entity. State is persisted in two layers:

1. **localStorage** (`roadmap2_data`) — immediate, always active
2. **Firestore** (`users/{uid}`) — debounced 1-second write, only when logged in

On login, Firestore state is loaded and overwrites localStorage. New users go through the onboarding flow in [src/components/SetupChoice.tsx](src/components/SetupChoice.tsx) which seeds 8 weeks of roadmap data from [src/data/seed.ts](src/data/seed.ts).

### Key Contexts

| Context | Purpose |
|---------|---------|
| `AppContext` | Global app state + dispatch |
| `AuthContext` | Firebase auth user object |
| `ThemeContext` | `data-theme` attribute toggle (dark default) |
| `ConfirmationContext` | Reusable confirm modal |

### Data Model

All types are in [src/types/index.ts](src/types/index.ts). Top-level `AppState` contains:
- `weeks: Week[]` — 8-week roadmap with tasks
- `dayLogs: DayLog[]` — daily study sessions
- `notes: Note[]` — rich-text notes with categories
- `storyCards: StoryCard[]` — STAR-format interview stories
- `dsaProblems: DSAProblem[]` — LeetCode/Codeforces log
- `sdTopics: SystemDesignTopic[]` — system design exercises
- `applications: Application[]` — job pipeline (Kanban)
- `mockInterviews: MockInterview[]` — mock session log
- `resources: Resource[]` — bookmarked learning materials
- `studyStreak: string[]` — ISO date strings

### Routing & Layout

[src/App.tsx](src/App.tsx) defines React Router v7 routes. All pages share a fixed sidebar (`Sidebar.tsx`, 240px) and topbar (`TopBar.tsx`, 60px). Pages live in [src/pages/](src/pages/).

Notable pages:
- [DetailPages.tsx](src/pages/DetailPages.tsx) — workspace views for individual entities (stories, applications, notes, etc.)
- [Applications.tsx](src/pages/Applications.tsx) — Kanban board using `@dnd-kit`
- [DSATracker.tsx](src/pages/DSATracker.tsx) — problem log with Recharts visualizations

### AI Integration

[src/lib/gemini.ts](src/lib/gemini.ts) exports `generateText(prompt)` and `generateJSON<T>(prompt, schema)` helpers using `@google/generative-ai`. Features using AI: Story Reviewer, DSA hint generator, note summarizer, tag extractor.

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

## Shorthand Commands

When the user says any of the following, act immediately without asking for clarification:

| Command | Action |
|---------|--------|
| `commit` | Stage all changed tracked files, generate a clean conventional commit message from the diff, and commit. No confirmation needed. |
| `build` | Run `npm run build` and report errors. |
| `dev` | Run `npm run dev`. |

**Commit message rules:** Use conventional commits (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`). One concise subject line. No body unless the change is genuinely complex. Always append the co-author trailer.

## Conventions

- Entity IDs are generated with `Math.random().toString(36)` — prefer `crypto.randomUUID()` for new code
- Add new reducer actions to `AppContext.tsx` using the existing pattern: discriminated union action type → `AppState` return
- New pages go in `src/pages/`, registered in `App.tsx`, and linked in `Sidebar.tsx`
- Firebase writes are handled exclusively inside `AppContext.tsx`; pages only call `dispatch`
