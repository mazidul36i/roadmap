<div align="center">

# 🗺 Roadmap Tracker

### A personal, production-grade job-switch preparation dashboard

**Track DSA · System Design · Stories · Applications · Mocks — all in one place**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📸 Preview

> **Light & Dark Mode** support, polished dashboard layout, smooth interactions, and mobile-friendly
> responsiveness.

![Dashboard](/Dashboard.png)

---

## ✨ Features

### 10 fully-functional sections

| Section                | What it does                                                                                |
|------------------------|---------------------------------------------------------------------------------------------|
| 📊 **Dashboard**       | Overall progress bars, study streak tracker, week-by-week overview, today's focus card      |
| 🗓 **Roadmap**         | 8 collapsible week cards · task status cycling (todo → in-progress → done) · per-task notes |
| 📅 **Daily Planner**   | Log study sessions with focus area, planned/completed hours, reflection · history timeline  |
| 📝 **Notes**           | Categorised notes (DSA, System Design, Interview, Company, Weekly) · autosave · AI tag extractor & summarizer |
| 📖 **Story Bank**      | STAR-format interview stories · tag filtering · AI story reviewer · copy short/long version |
| 💻 **DSA Tracker**     | Problem log with topic/difficulty filters · topic & difficulty bar charts · AI hint generator |
| 🏗 **System Design**   | Exercises + core concepts tabs · status tracking · tradeoffs & architecture notes           |
| 💼 **Applications**    | Kanban pipeline from Wishlist → Offer/Rejected · drag-and-drop · company details            |
| 🎙 **Mock Interviews** | Session log · score trend line chart · recurring weak points aggregated automatically       |
| 📚 **Resource Library**| Personal knowledge base for YouTube, articles, and repos · categorize and pin favorites     |
| ⚡ **Focus Mode**       | Full-screen minimal view of today's tasks · Esc to exit                                     |

### Extras

- **AI-Powered Features** — Gemini-powered story reviewer, DSA hint generator, note summarizer, and tag extractor
- **Rich Text Editor for Notes** — Full Tiptap integration with custom toolbar, bold/italic/code support, and premium typography
- **Light & Dark Themes** — Toggle between a sleek dark mode and a clean, high-contrast light mode via the TopBar
- **`Ctrl+K` Global Search** — searches across tasks, notes, stories, companies, and DSA problems simultaneously
- **Export / Import JSON** — full data backup and restore from the sidebar
- **Cloud Sync with Firebase** — Real-time database sync across devices with Google Authentication
- **Auto-save with Offline Support** — Persistence to both Firestore and `localStorage` ensures data is never lost, even when offline
- **Seeded sample data** — 8-week roadmap, STAR stories, DSA problems, system design topics, and sample applications pre-loaded on first launch
- **Responsive layout** — adapts cleanly to tablet and mobile viewports

---

## 🛠 Tech Stack

| Layer       | Choice                                          |
|-------------|-------------------------------------------------|
| Framework   | React 19 + TypeScript 6                         |
| Build Tool  | Vite 8                                          |
| Routing     | React Router v7                                 |
| AI          | Google Gemini (`@google/generative-ai`)         |
| Rich Text   | Tiptap                                          |
| Drag & Drop | dnd-kit                                         |
| Charts      | Recharts                                        |
| Animations  | Framer Motion                                   |
| Icons       | Lucide React                                    |
| Styling     | Vanilla CSS (custom design system, no Tailwind) |
| Persistence | **Firebase Firestore** + `localStorage` fallback |
| Auth        | **Firebase Authentication** (Google Sign-In)    |

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18+**
- npm or yarn
- A Google Gemini API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/mazidul36i/roadmap.git
cd roadmap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key:
# VITE_GEMINI_API_KEY=<your key>

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The app loads immediately with pre-seeded data — no sign-up required. Sign in with Google to enable cloud sync across devices.

### Build for production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Router + layout shell
├── main.tsx                 # React entry point
├── index.css                # Global design system (CSS variables, components)
│
├── context/
│   ├── AuthContext.tsx       # Firebase Auth state & helpers
│   └── AppContext.tsx        # Global state — useReducer + Firestore/LocalStorage sync
│
├── data/
│   └── seed.ts              # Pre-loaded 8-week roadmap + all sample data
│
├── types/
│   └── index.ts             # TypeScript interfaces for all entities
│
├── components/
│   ├── Sidebar.tsx          # Navigation + progress + export/import
│   └── TopBar.tsx           # Page title + Ctrl+K global search modal
│
└── pages/
    ├── Dashboard.tsx        # Stats, progress overview, streak, week grid
    ├── Roadmap.tsx          # 8-week accordion with task tracking
    ├── DailyPlanner.tsx     # Study log form + timeline history
    ├── Notes.tsx            # Categorised note editor with autosave + tags
    ├── StoryBank.tsx        # STAR story cards with tag filtering
    ├── DSATracker.tsx       # Problem table + charts + weak area detection
    ├── SystemDesign.tsx     # SD exercises and core concepts tracker
    ├── Applications.tsx     # Kanban pipeline with company detail modal
    ├── MockInterviews.tsx   # Mock session log + score trend + weak points
    ├── ResourceLibrary.tsx  # Centralized bookmarks for study materials
    └── FocusMode.tsx        # Full-screen focus view for current week
```

---

## 🗂 Data Model

All data lives in a single `AppState` object, persisted to **Firebase Firestore** (if logged in) and `localStorage` on every change:

```typescript
interface AppState {
  weeks: Week[];              // 8-week roadmap with tasks
  dayLogs: DayLog[];          // Daily study sessions
  notes: Note[];              // Categorised, tagged notes
  storyCards: StoryCard[];    // STAR-format interview stories
  dsaProblems: DSAProblem[];  // DSA problem log
  sdTopics: SystemDesignTopic[]; // System design topics
  applications: Application[]; // Job application pipeline
  mockInterviews: MockInterview[]; // Mock interview sessions
  resources: Resource[];      // Bookmarked links and materials
  studyStreak: string[];      // Array of ISO date strings
  startDate: string;          // Start of the 8-week plan
}
```

---

## 📅 The 8-Week Roadmap

| Week   | Focus                                                             |
|--------|-------------------------------------------------------------------|
| Week 1 | Story Bank + DSA Baseline                                         |
| Week 2 | DSA Patterns (two-pointer, sliding window, binary search, stacks) |
| Week 3 | Trees, Graphs, Heaps, DP Intro                                    |
| Week 4 | System Design Foundations                                         |
| Week 5 | Backend Architecture Depth (Kafka, CQRS, distributed systems)     |
| Week 6 | Mock Interviews + Applications Start                              |
| Week 7 | Full Interview Mode                                               |
| Week 8 | Offers, Negotiation & Close                                       |

---

## ⌨️ Keyboard Shortcuts

| Shortcut   | Action                            |
|------------|-----------------------------------|
| `Ctrl + K` | Open global search                |
| `Esc`      | Close any modal / exit Focus Mode |

---

## 💾 Data Backup

Your data is persisted to **Firebase Firestore** (when signed in) and `localStorage` (always). To manually back up or migrate:

1. Click **Export JSON** in the sidebar → saves `roadmap-data.json`
2. To restore: click **Import JSON** → select your backup file

---

## 🤝 Contributing

This is a personal productivity tool, but PRs are welcome for:

- Bug fixes
- New DSA topics or system design exercises
- UI improvements
- Performance optimisations

```bash
# Fork the repo, then:
git checkout -b feature/my-improvement
git commit -m "Add: my improvement"
git push origin feature/my-improvement
# Open a Pull Request
```

---

## 📄 License

MIT © [Mazidul Islam](https://github.com/mazidul36i)

---

<div align="center">
  <sub>Built to track a real 2-month job-switch preparation journey.</sub>
</div>
