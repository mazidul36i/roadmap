import type { LessonBody } from "@content/types";

const behStar: LessonBody = {
  id: "beh-star",
  blocks: [
    {
      type: "md",
      md: `Behavioral answers are judged on two things: **what you personally did**, and **whether it mattered**. STAR keeps you on track:

- **Situation**: one or two sentences of context. Just enough to make the stakes clear.
- **Task**: what *you* were responsible for.
- **Action**: the bulk of the answer. Your decisions, trade-offs and how you brought people along. Say "I".
- **Result**: a measurable outcome, plus what you learned or would do differently.`,
    },
    {
      type: "compare",
      title: "Time budget for a 2-minute answer",
      headers: ["Part", "Share", "Common mistake"],
      rows: [
        ["Situation + Task", "~20%", "Five minutes of company history"],
        ["Action", "~60%", '"We" did everything; no decisions or trade-offs'],
        ["Result", "~20%", "No numbers, or ending on the action"],
      ],
    },
    {
      type: "steps",
      title: "Upgrade a weak answer",
      items: [
        {
          title: "Weak",
          md: '"We had slow search, so the team added caching and it got faster."',
        },
        {
          title: "Make it yours",
          md: '"I profiled the slowest queries and found nested aggregations running in scoring mode."',
        },
        {
          title: "Show judgement",
          md: '"I moved filters to filter context and added a Redis layer for the top 200 query shapes, choosing a 5-minute TTL because catalogue data changes hourly."',
        },
        {
          title: "Land the result",
          md: '"P99 dropped from 2.8 s to 1.1 s, a 60% cut, and the cache hit rate held at 68%."',
        },
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Keep a story bank",
      md: "Six to eight strong stories can answer almost any behavioral question. Tag each by competency (ownership, conflict, failure…) in **Practice › Stories**, then rehearse them out loud.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        'Saying "we" so often that your role disappears',
        "No numbers in the result",
        "Choosing a story where you weren't the decision-maker",
        "Blaming others in conflict stories",
        "Rambling past three minutes",
      ],
    },
    { type: "quiz", ids: ["star-q1", "star-q2"] },
  ],
  quiz: [
    {
      id: "star-q1",
      prompt: "Which part of a STAR answer should take the most time?",
      choices: ["Situation", "Task", "Action", "Result"],
      answer: 2,
      explanation: "Interviewers assess your decisions and behaviour, which live in the Action.",
    },
    {
      id: "star-q2",
      prompt: "What makes a Result strong?",
      choices: ["It's long", "It's measurable and tied to the original problem, plus a reflection", "It praises the team", "It mentions technologies"],
      answer: 1,
      explanation: "Quantify the impact and close the loop on the stakes you set up.",
    },
  ],
  cards: [
    {
      id: "star-c1",
      front: "STAR time split?",
      back: "≈20% situation/task, 60% action, 20% result.",
    },
    {
      id: "star-c2",
      front: "The single biggest behavioral mistake?",
      back: 'Saying "we": the interviewer can\'t assess your contribution.',
    },
    {
      id: "star-c3",
      front: "What belongs in the Result?",
      back: "A measurable outcome tied to the stakes, plus a lesson or what you'd change.",
    },
    {
      id: "star-c4",
      front: "How many stories should a story bank have?",
      back: "Six to eight strong ones, tagged by competency.",
    },
  ],
};

const behIntro: LessonBody = {
  id: "beh-intro",
  blocks: [
    {
      type: "md",
      md: `"Tell me about yourself" is the one question you can fully prepare. Treat it as a **90-second trailer** that points the interviewer at your best material.

Use **Present → Past → Future**:

1. **Present**: your current role, scope and what you're known for (one line on impact).
2. **Past**: one or two highlights that prove it, ideally ones you have STAR stories for.
3. **Future**: why this role is the logical next step.`,
    },
    {
      type: "steps",
      title: "Template",
      items: [
        {
          title: "Present",
          md: "\"I'm a backend engineer at ___, where I own ___ for ___ users. Lately I've focused on ___.\"",
        },
        {
          title: "Past",
          md: '"Two things I\'m proud of: ___ (metric), and ___ (metric)."',
        },
        {
          title: "Future",
          md: '"I\'m looking for ___, which is why ___ at your company stood out."',
        },
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Plant hooks",
      md: "Mention achievements you *want* to be asked about. A good intro makes the interviewer's next question one you've already rehearsed.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Reading your CV chronologically from university",
        "Over two minutes",
        "Personal life details that don't serve the pitch",
        "No reason for the move, or a negative one",
      ],
    },
    { type: "quiz", ids: ["intro-q1", "intro-q2"] },
    {
      type: "callout",
      tone: "tip",
      title: "Rehearse it",
      md: "Ask the tutor to role-play an interviewer and critique your intro. Record yourself once: you'll hear filler words immediately.",
    },
  ],
  quiz: [
    {
      id: "intro-q1",
      prompt: "Best structure for 'Tell me about yourself'?",
      choices: [
        "Chronological CV walk-through",
        "Present → Past → Future in about 90 seconds",
        "Hobbies first to build rapport",
        "Ask them what they want to hear",
      ],
      answer: 1,
      explanation: "It's concise, relevant, and ends on why you're here.",
    },
    {
      id: "intro-q2",
      prompt: "Why mention specific achievements in your intro?",
      choices: ["To fill time", "To plant hooks for follow-up questions you've prepared", "Interviewers require it", "To avoid technical questions"],
      answer: 1,
      explanation: "You steer the conversation towards your strongest stories.",
    },
  ],
  cards: [
    {
      id: "intro-c1",
      front: "Structure for 'Tell me about yourself'?",
      back: "Present → Past → Future, ~90 seconds.",
    },
    {
      id: "intro-c2",
      front: "What's a 'hook' in your intro?",
      back: "An achievement you mention so the interviewer asks about it, leading to a rehearsed story.",
    },
    {
      id: "intro-c3",
      front: "Intro red flags?",
      back: "CV recital, over two minutes, negativity about your current job.",
    },
  ],
};

const behCompetencies: LessonBody = {
  id: "beh-competencies",
  blocks: [
    {
      type: "md",
      md: `Senior behavioral rounds are a checklist of **competencies**. Each question maps to one, and the interviewer listens for specific signals. Know what "good" sounds like for each and you can pick the right story instantly.`,
    },
    {
      type: "compare",
      title: "What they probe and what earns the point",
      headers: ["Competency", "Typical question", "Strong signal"],
      rows: [
        ["Ownership", "Tell me about something you drove end to end.", "You noticed the problem, nobody asked, you saw it through after launch"],
        ["Conflict", "A time you disagreed with a colleague or manager.", "Disagreed with data, listened, committed to the outcome, relationship intact"],
        ["Failure", "Tell me about a mistake.", "Real stakes, owns it without excuses, concrete change afterwards"],
        ["Ambiguity", "A project with unclear requirements.", "Made assumptions explicit, de-risked with quick experiments"],
        ["Influence", "Convincing others without authority.", "Understood their incentives, built the case, gave credit"],
        ["Impact", "Your most impactful project.", "Business metric, not just technical output"],
        ["Mentoring", "Helping someone grow.", "Specific coaching, the person's measurable progress"],
        ["Prioritisation", "Too much to do, too little time.", "Explicit trade-off framework, said no to something"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Failure stories are a gift",
      md: 'A genuine failure, owned cleanly with what you changed afterwards, signals seniority more than another success. Avoid fake failures ("I work too hard").',
    },
    {
      type: "callout",
      tone: "tip",
      title: "Coverage check",
      md: "Stories tagged with these competencies show up in the coverage matrix on the Stories page, so you can spot gaps before an interviewer does.",
    },
    { type: "quiz", ids: ["comp-q1", "comp-q2"] },
  ],
  quiz: [
    {
      id: "comp-q1",
      prompt: "In a conflict story, what's the strongest ending?",
      choices: [
        "You were proven right",
        "You committed to the decision and the relationship stayed strong",
        "Your manager sided with you",
        "You escalated successfully",
      ],
      answer: 1,
      explanation: "Interviewers look for disagree-and-commit maturity, not winning.",
    },
    {
      id: "comp-q2",
      prompt: "A strong failure story includes…",
      choices: [
        "A minor mistake with no consequences",
        "Real stakes, clear ownership, and what you changed afterwards",
        "Blame shared across the team",
        "A weakness disguised as a strength",
      ],
      answer: 1,
      explanation: "Ownership and learning are what's assessed.",
    },
  ],
  cards: [
    {
      id: "comp-c1",
      front: "Signals of a strong ownership story?",
      back: "You spotted it unprompted, drove it end to end, and followed through after launch.",
    },
    {
      id: "comp-c2",
      front: "Conflict story: what do interviewers want?",
      back: "Data-driven disagreement, listening, disagree-and-commit, relationship intact.",
    },
    {
      id: "comp-c3",
      front: "Ambiguity story signals?",
      back: "Made assumptions explicit, validated quickly, adjusted course.",
    },
    {
      id: "comp-c4",
      front: "Influence without authority?",
      back: "Understand others' incentives, build the case with data, share credit.",
    },
  ],
};

const behClosing: LessonBody = {
  id: "beh-closing",
  blocks: [
    {
      type: "md",
      md: `The last five minutes are **your interview of them**. Thoughtful questions signal seniority and help you avoid a bad move. Prepare three or four, tailored to who you're talking to.`,
    },
    {
      type: "compare",
      title: "Questions worth asking",
      headers: ["To", "Question", "What you learn"],
      rows: [
        ["Engineer", "What did the last incident teach the team?", "Blameless culture, operational maturity"],
        ["Engineer", "How does code get from a laptop to production?", "CI/CD health, autonomy"],
        ["Manager", "What would make someone exceptional in this role in six months?", "Real expectations"],
        ["Manager", "How are priorities set when everything is urgent?", "Planning sanity"],
        ["Anyone", "What's something you'd change about how the team works?", "Honest friction points"],
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Close the loop",
      md: 'Before you finish: "Is there anything in my background you\'d like me to clarify?" It surfaces hidden concerns while you can still address them.',
    },
    {
      type: "checklist",
      title: "Avoid",
      items: [
        '"No questions"',
        "Questions answered on their careers page",
        "Leading with salary and holidays in early rounds",
        "Negativity about your current employer",
      ],
    },
    { type: "quiz", ids: ["close-q1", "close-q2"] },
  ],
  quiz: [
    {
      id: "close-q1",
      prompt: "Which closing question best surfaces hidden concerns?",
      choices: ["What's the salary range?", "Is there anything in my background you'd like me to clarify?", "When can I start?", "Do you like working here?"],
      answer: 1,
      explanation: "It invites objections while you can still respond.",
    },
    {
      id: "close-q2",
      prompt: "Why ask engineers about their last incident?",
      choices: ["To trap them", "It reveals blameless culture and operational maturity", "It's required", "To fill time"],
      answer: 1,
      explanation: "How teams talk about failure tells you a lot about working there.",
    },
  ],
  cards: [
    {
      id: "close-c1",
      front: "Best last question in an interview?",
      back: '"Is there anything in my background you\'d like me to clarify?"',
    },
    {
      id: "close-c2",
      front: "Good question for a hiring manager?",
      back: '"What would make someone exceptional in this role in six months?"',
    },
    {
      id: "close-c3",
      front: "Closing anti-patterns?",
      back: "No questions, questions answered online, early salary focus, negativity.",
    },
  ],
};

const lessons: LessonBody[] = [behStar, behIntro, behCompetencies, behClosing];
export default lessons;
