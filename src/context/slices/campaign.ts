import type { Task, Week } from "@app-types/index";
import { uid } from "@lib/id";
import { localDateKey } from "@lib/dates";
import type { Slice } from "./types";

const mapWeek = (weeks: Week[], weekId: string, fn: (w: Week) => Week) =>
  weeks.map(w => (w.id === weekId ? fn(w) : w));

const mapTask = (week: Week, taskId: string, fn: (t: Task) => Task): Week => ({
  ...week,
  tasks: week.tasks.map(t => (t.id === taskId ? fn(t) : t)),
});

/** Keeps doneAt in step with status so streaks and history know when work finished. */
function withStatus(task: Task, status: Task["status"]): Task {
  if (status === task.status) return task;
  return { ...task, status, doneAt: status === "done" ? localDateKey() : undefined };
}

export const campaignSlice: Slice = (state, action) => {
  switch (action.type) {
    case "UPDATE_TASK_STATUS":
      return {
        ...state,
        weeks: mapWeek(state.weeks, action.weekId, w => mapTask(w, action.taskId, t => withStatus(t, action.status))),
      };
    case "UPDATE_TASK_NOTES":
      return {
        ...state,
        weeks: mapWeek(state.weeks, action.weekId, w => mapTask(w, action.taskId, t => ({ ...t, notes: action.notes }))),
      };
    case "UPDATE_TASK":
      return {
        ...state,
        weeks: mapWeek(state.weeks, action.weekId, w =>
          mapTask(w, action.taskId, t => {
            const { status, ...rest } = action.updates;
            const next = { ...t, ...rest };
            return status ? withStatus(next, status) : next;
          }),
        ),
      };
    case "UPDATE_WEEK":
      return { ...state, weeks: mapWeek(state.weeks, action.weekId, w => ({ ...w, ...action.updates })) };
    case "ADD_WEEK": {
      const number = state.weeks.reduce((max, w) => Math.max(max, w.number), 0) + 1;
      const week: Week = {
        id: uid(),
        number,
        title: action.week?.title ?? `Sprint ${number}`,
        goal: action.week?.goal ?? "",
        tasks: [],
      };
      return { ...state, weeks: [...state.weeks, week] };
    }
    case "DELETE_WEEK":
      return {
        ...state,
        weeks: state.weeks.filter(w => w.id !== action.weekId).map((w, i) => ({ ...w, number: i + 1 })),
      };
    case "ADD_TASK":
      return {
        ...state,
        weeks: mapWeek(state.weeks, action.weekId, w => ({
          ...w,
          tasks: [...w.tasks, { id: uid(), weekId: w.id, title: "New task", status: "todo", notes: "", ...action.task }],
        })),
      };
    case "DELETE_TASK":
      return {
        ...state,
        weeks: mapWeek(state.weeks, action.weekId, w => ({ ...w, tasks: w.tasks.filter(t => t.id !== action.taskId) })),
      };
    case "REORDER_TASKS":
      return {
        ...state,
        weeks: mapWeek(state.weeks, action.weekId, w => {
          const byId = new Map(w.tasks.map(t => [t.id, t]));
          const ordered = action.taskIds.map(id => byId.get(id)).filter((t): t is Task => !!t);
          const rest = w.tasks.filter(t => !action.taskIds.includes(t.id));
          return { ...w, tasks: [...ordered, ...rest] };
        }),
      };
    case "ADD_DAY_LOG":
      return { ...state, dayLogs: [action.log, ...state.dayLogs] };
    case "UPDATE_DAY_LOG":
      return { ...state, dayLogs: state.dayLogs.map(d => (d.id === action.log.id ? action.log : d)) };
    case "DELETE_DAY_LOG":
      return { ...state, dayLogs: state.dayLogs.filter(d => d.id !== action.id) };
    default:
      return undefined;
  }
};
