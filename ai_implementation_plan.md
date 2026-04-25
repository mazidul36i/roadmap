# AI Integration Implementation Plan

This document outlines the dedicated plan for integrating real Artificial Intelligence (via Google's Gemini API) into the Roadmap Tracker, moving beyond the current hardcoded/simulated features.

## User Review Required

> [!IMPORTANT]
> This plan requires a **Google Gemini API Key**. The user will need to provide this key in their environment variables (`VITE_GEMINI_API_KEY`).

> [!NOTE]
> All AI features will be designed to fail gracefully. If the API key is missing or the request fails, the app will revert to the current heuristic-based logic.

## Proposed AI Features

### 1. Real STAR Story Reviewer (Story Bank)
- **Problem**: Current feedback is based on static regex rules.
- **AI Solution**: Send the story to Gemini for a nuanced review.
- **Action**:
  - `[NEW]` `src/lib/gemini.ts` to handle API calls.
  - `[MODIFY]` `src/pages/StoryBank.tsx` to call the AI service.
  - **Output**: 0-100 score, specific improvement tips, and a "Perfected" version of the story.

### 2. Smart DSA Assistant (DSA Tracker)
- **Problem**: Problem recommendations are random; mistakes are not analyzed.
- **AI Solution**: 
  - **Explain Mistakes**: Analyze the "Mistakes Made" field to identify core weaknesses.
  - **Progressive Hints**: Provide helpful hints without giving away the full solution.
- **Action**:
  - `[MODIFY]` `src/pages/DSATracker.tsx` to add "AI Help" buttons to problem rows.

### 3. Dynamic Roadmap Tasks & Mock Prep
- **Problem**: Mock questions and roadmap tasks are hardcoded.
- **AI Solution**:
  - **Fresh Questions**: Generate questions specific to the week's title.
  - **Role-Based Roadmaps**: Allow generating a new 8-week plan based on a Job Description.
- **Action**:
  - `[MODIFY]` `src/pages/Roadmap.tsx` to integrate dynamic question generation.

### 4. AI Mock Interviewer (New Module)
- **AI Solution**: A chat-based interface where the AI conducts a mock interview for a specific topic or story.
- **Action**:
  - `[NEW]` `src/pages/MockInterviewRoom.tsx`.

---

## Technical Architecture

### [NEW] [gemini.ts](file:///c:/Users/Mazid/VSCodeProjects/Roadmap/src/lib/gemini.ts)
A service layer using `@google/generative-ai`.
```typescript
export const analyzeStory = async (story: StoryCard) => { ... }
export const getDSAHint = async (problem: DSAProblem) => { ... }
export const generateQuestions = async (topic: string) => { ... }
```

## Verification Plan

### Automated Tests
- Mock the Gemini SDK to verify UI transitions and error states.

### Manual Verification
- Testing with different "Mistakes Made" inputs to see if AI identifies patterns correctly.
- Verifying the "Mock Prep" questions change each time (dynamic).
