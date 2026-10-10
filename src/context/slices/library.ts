import type { Slice } from "./types";

function unlink<T extends { linkedNoteIds?: string[] }>(entity: T, noteId: string): T {
  if (!entity.linkedNoteIds?.includes(noteId)) return entity;
  return { ...entity, linkedNoteIds: entity.linkedNoteIds.filter(id => id !== noteId) };
}

export const librarySlice: Slice = (state, action) => {
  switch (action.type) {
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "UPDATE_NOTE":
      return { ...state, notes: state.notes.map(n => (n.id === action.note.id ? action.note : n)) };
    case "DELETE_NOTE":
      return {
        ...state,
        notes: state.notes.filter(n => n.id !== action.id),
        // Drop dangling links so no entity points at a deleted note.
        storyCards: state.storyCards.map(s => unlink(s, action.id)),
        dsaProblems: state.dsaProblems.map(p => unlink(p, action.id)),
        sdTopics: state.sdTopics.map(t => unlink(t, action.id)),
        applications: state.applications.map(a => unlink(a, action.id)),
        mockInterviews: state.mockInterviews.map(m => unlink(m, action.id)),
        resources: state.resources.map(r => unlink(r, action.id)),
      };
    case "ADD_RESOURCE":
      return { ...state, resources: [action.resource, ...state.resources] };
    case "UPDATE_RESOURCE":
      return { ...state, resources: state.resources.map(r => (r.id === action.resource.id ? action.resource : r)) };
    case "DELETE_RESOURCE":
      return { ...state, resources: state.resources.filter(r => r.id !== action.id) };
    case "TOGGLE_RESOURCE_PIN":
      return {
        ...state,
        resources: state.resources.map(r => (r.id === action.id ? { ...r, isPinned: !r.isPinned } : r)),
      };
    default:
      return undefined;
  }
};
