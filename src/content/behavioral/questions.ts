// Behavioral question bank, tagged by competency. Tags match STORY_TAGS so the
// Stories page can show which questions each story covers.

export type Competency =
  | "ownership"
  | "conflict"
  | "failure"
  | "ambiguity"
  | "leadership"
  | "collaboration"
  | "mentoring"
  | "customer impact"
  | "deadline"
  | "performance"
  | "architecture"
  | "reliability";

export interface BehavioralQuestion {
  id: string;
  text: string;
  competencies: Competency[];
}

const q = (
  id: string,
  text: string,
  ...competencies: Competency[]
): BehavioralQuestion => ({ id, text, competencies });

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  q(
    "q-own-1",
    "Tell me about a project you drove from idea to production.",
    "ownership",
    "leadership",
  ),
  q(
    "q-own-2",
    "Describe a time you fixed something nobody asked you to fix.",
    "ownership",
  ),
  q(
    "q-own-3",
    "Tell me about a time you took responsibility for something outside your role.",
    "ownership",
    "collaboration",
  ),
  q(
    "q-own-4",
    "What's a technical decision you made that you'd defend today?",
    "ownership",
    "architecture",
  ),
  q(
    "q-con-1",
    "Tell me about a time you disagreed with your manager.",
    "conflict",
  ),
  q(
    "q-con-2",
    "Describe a disagreement with a peer about a technical approach.",
    "conflict",
    "architecture",
  ),
  q(
    "q-con-3",
    "Tell me about working with someone difficult.",
    "conflict",
    "collaboration",
  ),
  q(
    "q-con-4",
    "When did you push back on a product requirement?",
    "conflict",
    "customer impact",
  ),
  q(
    "q-fail-1",
    "Tell me about a mistake that reached production.",
    "failure",
    "reliability",
  ),
  q("q-fail-2", "Describe a project that didn't go as planned.", "failure"),
  q(
    "q-fail-3",
    "What's the most important feedback you've received?",
    "failure",
    "mentoring",
  ),
  q(
    "q-fail-4",
    "Tell me about a time you missed a deadline.",
    "failure",
    "deadline",
  ),
  q(
    "q-amb-1",
    "Tell me about a project with unclear requirements.",
    "ambiguity",
  ),
  q(
    "q-amb-2",
    "Describe a time you had to make a decision without enough data.",
    "ambiguity",
    "ownership",
  ),
  q(
    "q-amb-3",
    "How did you approach a problem you'd never solved before?",
    "ambiguity",
  ),
  q(
    "q-lead-1",
    "Tell me about a time you led without formal authority.",
    "leadership",
    "collaboration",
  ),
  q(
    "q-lead-2",
    "Describe how you got a team aligned on a direction.",
    "leadership",
  ),
  q(
    "q-lead-3",
    "Tell me about a time you had to influence another team.",
    "leadership",
    "collaboration",
  ),
  q(
    "q-col-1",
    "Describe a successful cross-team collaboration.",
    "collaboration",
  ),
  q(
    "q-col-2",
    "Tell me about helping a teammate who was struggling.",
    "collaboration",
    "mentoring",
  ),
  q(
    "q-men-1",
    "Tell me about someone you mentored.",
    "mentoring",
    "leadership",
  ),
  q(
    "q-men-2",
    "How have you raised the engineering bar on your team?",
    "mentoring",
    "ownership",
  ),
  q(
    "q-cust-1",
    "Tell me about a time you went above and beyond for a customer.",
    "customer impact",
  ),
  q(
    "q-cust-2",
    "Describe a feature where you changed the plan based on user feedback.",
    "customer impact",
    "ambiguity",
  ),
  q("q-dead-1", "Tell me about delivering under a tight deadline.", "deadline"),
  q(
    "q-dead-2",
    "How did you decide what to cut when time ran out?",
    "deadline",
    "ownership",
  ),
  q(
    "q-perf-1",
    "Tell me about a performance problem you diagnosed.",
    "performance",
  ),
  q(
    "q-perf-2",
    "Describe the biggest optimisation you've shipped.",
    "performance",
    "customer impact",
  ),
  q("q-arch-1", "Tell me about a system you designed.", "architecture"),
  q(
    "q-arch-2",
    "Describe a time you paid down significant technical debt.",
    "architecture",
    "ownership",
  ),
  q(
    "q-arch-3",
    "Tell me about a migration you led.",
    "architecture",
    "leadership",
  ),
  q(
    "q-rel-1",
    "Tell me about an outage you handled.",
    "reliability",
    "failure",
  ),
  q(
    "q-rel-2",
    "How did you make a system more reliable?",
    "reliability",
    "architecture",
  ),
  q(
    "q-rel-3",
    "Describe how you handled an on-call incident at night.",
    "reliability",
    "deadline",
  ),
  q(
    "q-gen-1",
    "What's the project you're most proud of?",
    "ownership",
    "customer impact",
  ),
  q("q-gen-2", "Why are you leaving your current role?", "ambiguity"),
  q(
    "q-gen-3",
    "Tell me about a time you learned a new technology quickly.",
    "ambiguity",
    "ownership",
  ),
  q(
    "q-gen-4",
    "Describe a trade-off you made between speed and quality.",
    "deadline",
    "architecture",
  ),
  q(
    "q-gen-5",
    "Tell me about a time you simplified something complex.",
    "architecture",
    "collaboration",
  ),
  q(
    "q-gen-6",
    "What do you do when you're blocked by another team?",
    "collaboration",
    "ownership",
  ),
];

/** Story tags (from the story bank) that map onto competencies. */
export const TAG_TO_COMPETENCY: Record<string, Competency> = {
  ownership: "ownership",
  leadership: "leadership",
  conflict: "conflict",
  failure: "failure",
  ambiguity: "ambiguity",
  collaboration: "collaboration",
  mentoring: "mentoring",
  "customer impact": "customer impact",
  deadline: "deadline",
  performance: "performance",
  optimization: "performance",
  search: "performance",
  architecture: "architecture",
  "data pipeline": "architecture",
  "async processing": "architecture",
  reliability: "reliability",
};
