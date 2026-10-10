import { useApp } from "@context/AppContext";

/** Human title for the current route, including entity names on detail pages. */
export function useRouteTitle(pathname: string, fallback?: string): string {
  const { state } = useApp();
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 1];
  const isNew = id === "new";

  const named = (collection: { id: string }[], key: string, newLabel: string) => {
    if (isNew) return newLabel;
    const found = collection.find(e => e.id === id) as Record<string, unknown> | undefined;
    return (found?.[key] as string) || fallback || "";
  };

  if (pathname.startsWith("/practice/problems/")) return named(state.dsaProblems, "name", "New problem");
  if (pathname.startsWith("/practice/stories/")) return named(state.storyCards, "title", "New story");
  if (pathname.startsWith("/practice/mocks/")) {
    if (isNew) return "Log a mock";
    const mock = state.mockInterviews.find(m => m.id === id);
    return mock ? `${mock.type} mock · ${mock.date}` : fallback ?? "Mock interview";
  }
  if (pathname.startsWith("/career/")) {
    if (isNew) return "New application";
    const app = state.applications.find(a => a.id === id);
    return app ? `${app.company} · ${app.role}` : fallback ?? "Application";
  }
  if (pathname.startsWith("/resources/")) return named(state.resources, "title", "New resource");
  if (pathname.startsWith("/learn/system-design/topics/")) return named(state.sdTopics, "title", "New topic");
  if (pathname.startsWith("/notes/")) return named(state.notes, "title", "New note") || "Untitled note";
  return fallback ?? "Forge";
}
