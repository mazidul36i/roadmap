# AI Enhancements – Actionable Tasks

Below is a comprehensive list of potential AI‑driven features for the **Roadmap Tracker** application. Each item is written as a checklist entry that can be tracked, assigned, and prioritized. Feel free to edit, reorder, or remove tasks as needed.

## General / Infrastructure
- [x] **Gemini API Service Layer** – `src/lib/gemini.ts` wraps GoogleGenerativeAI with `generateText()` and `generateJSON()` helpers using `gemini-2.0-flash-preview`.
- [ ] **Error‑Handling & Rate‑Limit Middleware** – Add generic retry and exponential back‑off for Gemini calls. *(only basic try/catch exists currently)*
- [~] **AI Feature Toggle** – `aiEnabled?: boolean` is defined in `AppState` (src/types/index.ts) and checked in StoryBank, Notes, and DSATracker, but there is no reducer action to toggle it and no Firebase persistence yet.
    - I want to make the AI feature flag control in the firebase, so that I can enable or disable for a user from within the firebase database console manually (for now).
- [x] **Secure Storage of API Key** – `VITE_GEMINI_API_KEY` is loaded from `.env` via Vite's env handling.
    - [ ] Add a `.env.example` so the key is documented without being committed.

## Story Bank (STAR Stories)
- [x] **AI‑Powered Story Reviewer** – Gemini prompt scores a story and provides improvement tips (StoryBank.tsx); heuristic fallback when AI is disabled.
- [ ] **Story Idea Generator** – Prompt Gemini to suggest new STAR story topics based on user's role or industry.
- [x] **Automatic Tag Extraction** – Gemini infers relevant tags from a story's text (StoryBank.tsx).
- [x] **Story Summarizer** – Generates a concise elevator‑pitch / short version of a story (StoryBank.tsx).
- [ ] **Context‑Aware Feedback** – When a user edits a story, provide inline suggestions powered by Gemini.

## DSA Tracker (LeetCode Problems)
- [ ] **Problem Difficulty Predictor** – Ask Gemini to estimate difficulty based on problem description and user's past performance.
- [ ] **Conceptual Mistake Analyzer** – When a user submits a solution, Gemini analyses the code and highlights conceptual gaps (e.g., missing edge‑case handling).
- [x] **Progressive Hint Generation** – 3-level tiered hints (easy → medium → hard) generated on‑the‑fly by Gemini (DSATracker.tsx).
- [ ] **Smart Problem Recommender** – Recommend next problems based on completed topics, difficulty trends, and user‑defined goals.
- [x] **Solution Explanation Generator** – Natural‑language walkthrough of the optimal solution with intuition and complexity analysis (DSATracker.tsx).
- [ ] **Code Refactor Suggestions** – Suggest more idiomatic or performant code snippets.

## Roadmap Page (Career Planning)
- [ ] **Dynamic Roadmap Suggestions** – Gemini proposes next milestones based on current skill gaps and user's target job role.
- [ ] **Job Description Matcher** – Upload a JD and receive a customized roadmap aligning required skills with existing tasks.
- [ ] **Personalized Learning Path Generator** – For each roadmap item, generate a list of resources (articles, videos, courses) curated by Gemini.
- [ ] **Goal‑Based Progress Forecast** – Predict timeline to reach a target position using AI‑estimated learning speed.

## Mock Interview Module
- [ ] **AI Interviewer Bot** – Conduct a simulated interview via chat, asking behavioral and technical questions, and scoring responses.
- [ ] **Real‑Time Response Evaluation** – Analyze spoken or typed answers and give instant feedback on structure, relevance, and confidence.
- [ ] **Custom Question Bank Generation** – Generate role‑specific interview questions based on the user's selected job title.
- [ ] **Post‑Interview Summary Report** – Summarise strengths, weaknesses, and actionable improvement steps.

## Notes & Documentation
- [x] **Auto‑Summarize Long Notes** – Bullet‑point summaries generated from note content via Gemini (Notes.tsx).
- [x] **Keyword Extraction & Tagging** – Auto‑extracts relevant tags from note content using Gemini (Notes.tsx).
- [ ] **Intelligent Search** – Implement a semantic search that matches query intent with note content via embeddings.

## Global UI / UX Enhancements
- [ ] **Micro‑Animation Suggestions** – Use Gemini to suggest subtle animations (e.g., hover effects) that improve perceived premium feel.
- [ ] **Dynamic Color Palette Recommendations** – Generate harmonious color schemes based on user‑selected theme (dark / light).
- [ ] **Content‑Aware Tooltip Generation** – Auto‑create helpful tooltips explaining UI elements, powered by Gemini.

## Data & Sync Layer
- [ ] **AI‑Driven Analytics Dashboard** – Summarise user activity (e.g., most‑used features, progress trends) with natural‑language insights.

---

### Legend
- `[x]` Implemented
- `[~]` Partially implemented
- `[ ]` Not started

Feel free to edit, combine, or split these tasks to match your development roadmap. Each checklist item can be turned into a user story or a Jira ticket as you see fit.
