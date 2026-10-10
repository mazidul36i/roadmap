// Visualizer frames are plain data produced by pure generator functions and
// drawn by a handful of renderers. Each frame can carry a "predict the next
// step" question that the player asks before revealing the following frame.

export type Tone = "default" | "active" | "window" | "muted" | "found" | "bad" | "done" | "compare";

export interface Cell {
  value: string | number;
  tone?: Tone;
  /** Small caption under the cell (index, count…). */
  sub?: string;
}

export interface Pointer {
  index: number;
  label: string;
  tone?: "brand" | "info" | "xp" | "success" | "danger";
}

export interface ArrayState {
  kind: "array";
  rows: Array<{ label?: string; cells: Cell[]; pointers?: Pointer[]; showIndex?: boolean }>;
  /** Side panel: a stack or queue drawn vertically/horizontally. */
  stack?: { label: string; items: Array<string | number>; vertical?: boolean };
  vars?: Array<[string, string | number]>;
}

export interface GridState {
  kind: "grid";
  cells: Cell[][];
  current?: [number, number];
  queue?: string[];
  vars?: Array<[string, string | number]>;
}

export interface GraphNode {
  id: string;
  label: string;
  x: number; // 0..100
  y: number; // 0..100
  tone?: Tone;
  badge?: string | number;
}

export interface GraphState {
  kind: "graph";
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string; tone?: Tone; directed?: boolean }>;
  lists?: Array<{ label: string; items: Array<string | number> }>;
  vars?: Array<[string, string | number]>;
}

export interface TableState {
  kind: "table";
  colHeaders: string[];
  rowHeaders: string[];
  cells: Cell[][];
  vars?: Array<[string, string | number]>;
}

export interface ListState {
  kind: "list";
  nodes: Cell[];
  /** Index the last node points back to, if the list has a cycle. */
  cycleTo: number | null;
  pointers: Pointer[];
  vars?: Array<[string, string | number]>;
}

export type VizState = ArrayState | GridState | GraphState | TableState | ListState;

export interface Prediction {
  question: string;
  choices: string[];
  answer: number;
}

export interface Frame {
  state: VizState;
  note: string;
  /** Asked before advancing past this frame when Predict mode is on. */
  predict?: Prediction;
}
