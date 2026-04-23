Build a responsive, interactive single-page roadmap tracker webpage for my 2-month job-switch preparation plan.

Goal:
I want one place to track my progress, write notes, review interview prep, and stay organized across DSA, system design, applications, and mock interviews.

Build it as a polished, modern web app with a clean dashboard layout. Use a dark theme by default, strong visual hierarchy, smooth interactions, and mobile-friendly responsiveness. The app should feel like a serious personal productivity tool, not a simple checklist.

Core structure:
1. Top dashboard summary
   - Show overall progress across the full 8-week roadmap.
   - Include progress bars for:
     - DSA completion
     - System design completion
     - Story bank completion
     - Applications sent
     - Mock interviews completed
   - Show a streak or consistency indicator for study days.
   - Show “today’s focus” based on the roadmap stage.

2. Week-by-week roadmap view
   - Display the 8 weeks of the roadmap in collapsible cards or tabs.
   - Each week should show:
     - title
     - goal
     - key tasks
     - checkbox completion state for each task
     - optional notes field per task
   - The roadmap should support marking tasks as:
     - not started
     - in progress
     - done
   - Progress should update automatically when tasks are checked.

3. Daily planner
   - Add a section for daily planning with:
     - date
     - selected focus area
     - planned study time
     - completed study time
     - short reflection note
   - Let me log what I actually did each day.
   - Include a simple history timeline of past days.

4. Notes system
   - Add a dedicated notes area with:
     - weekly notes
     - DSA notes
     - system design notes
     - interview notes
     - company-specific notes
   - Notes should be searchable and taggable.
   - Support quick note creation from anywhere in the app.
   - Notes should autosave.

5. Story bank section
   - Create a structured interview story bank for my Prospecta work experience.
   - Each story card should include:
     - title
     - problem
     - action
     - result
     - metrics
     - short version
     - long version
   - Add fields for interview-ready phrasing.
   - Allow tagging stories by topic such as:
     - performance
     - search
     - async processing
     - data pipeline
     - architecture
     - reliability
     - optimization

6. DSA tracker
   - Add a DSA practice log where I can track:
     - problem name
     - topic
     - difficulty
     - platform
     - solved or not
     - time taken
     - pattern used
     - mistakes made
   - Show DSA stats by topic and difficulty.
   - Highlight weak areas automatically.

7. System design tracker
   - Add a system design study section for tracking:
     - topics studied
     - systems designed
     - tradeoffs learned
     - architecture notes
   - Include cards for design exercises like:
     - URL shortener
     - notification service
     - rate limiter
     - pastebin
     - file upload service
     - analytics pipeline
   - Let me store architecture diagrams or diagram links as text references.

8. Job application tracker
   - Add a simple application pipeline with statuses:
     - wishlist
     - applied
     - referred
     - interview scheduled
     - technical round
     - system design round
     - offer
     - rejected
   - Each company entry should store:
     - company name
     - role
     - location
     - compensation target
     - notes
     - referral info
     - interview dates
   - Include filters and search.

9. Mock interview tracker
   - Add a section for mock interviews with:
     - type (DSA, system design, resume/story)
     - date
     - score
     - what went wrong
     - what to improve
   - Show recurring weak points over time.

10. Helpful extras
   - Global search across tasks, notes, stories, and companies.
   - Tags and filters everywhere.
   - Export and import data as JSON.
   - Auto-save to localStorage.
   - Optional keyboard shortcuts for quick add and search.
   - A “focus mode” that shows only today’s task list.
   - A “review weak areas” panel that recommends what I should work on next based on incomplete or weak items.
   - A compact weekly calendar or timeline view.

Design requirements:
- Clean, modern, professional UI
- Dark theme with good contrast
- Rounded cards, subtle shadows, smooth transitions
- Strong spacing and readable typography
- Use color carefully to indicate status and progress
- Avoid clutter; organize content into tabs, cards, or sidebar sections
- Include icons where useful
- Make the interface feel motivating but practical

Behavior requirements:
- Everything should be interactive.
- Data should persist locally in the browser.
- Users should be able to add, edit, delete, search, and filter entries.
- Progress should recalculate automatically.
- Sections should feel connected, not isolated.

Content to preload:
- Preload the 8-week roadmap structure for:
  - Week 1: Story bank + DSA baseline
  - Week 2: DSA patterns
  - Week 3: Trees, graphs, heaps
  - Week 4: System design foundations
  - Week 5: Backend architecture depth
  - Week 6: Mock interviews + applications
  - Week 7: Full interview mode
  - Week 8: Offers, negotiation, close

Important:
- The app should be usable immediately with seeded sample data.
- Keep the layout intuitive.
- Make sure the roadmap, notes, and trackers all work together as one system.
- Build something I can actually use every day for the next 2 months.

Deliver it as a polished production-style frontend with clean component structure and realistic sample data.