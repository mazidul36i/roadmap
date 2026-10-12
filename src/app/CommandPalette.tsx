import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Dialog as RDialog, VisuallyHidden } from "radix-ui";
import { BookOpenText, Briefcase, CheckSquare, Code2, Library, Mic, Moon, Network, Plus, Search, StickyNote, Timer, Zap } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useTheme } from "@context/ThemeContext";
import { Kbd } from "@ui/index";
import overlay from "@ui/Overlay.module.css";
import { ALL_NAV_ITEMS } from "./nav";
import { LESSONS, lessonPath } from "@content/catalog";
import { GraduationCap } from "lucide-react";
import { usePaletteExtensions } from "./paletteRegistry";
import s from "./CommandPalette.module.css";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string[];
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { state, dispatch, isTimerVisible, setIsTimerVisible } = useApp();
  const { theme, toggleTheme } = useTheme();
  const extensions = usePaletteExtensions();

  const go = (to: string) => () => {
    onOpenChange(false);
    navigate(to);
  };

  const actions: PaletteItem[] = useMemo(
    () => [
      {
        id: "new-note",
        label: "New note",
        icon: <StickyNote size={16} />,
        keywords: ["write", "create"],
        run: () => {
          const id = uid();
          const now = new Date().toISOString();
          dispatch({ type: "ADD_NOTE", note: { id, title: "", content: "", tags: [], createdAt: now, updatedAt: now } });
          onOpenChange(false);
          navigate(`/notes/${id}`);
        },
      },
      { id: "log-problem", label: "Log a problem", icon: <Code2 size={16} />, keywords: ["dsa", "leetcode", "add"], run: go("/practice/problems/new") },
      { id: "ai-mock", label: "Start an AI mock interview", icon: <Mic size={16} />, keywords: ["interview", "practice", "ai"], run: go("/practice/mocks/ai") },
      { id: "log-mock", label: "Log a mock interview", icon: <Mic size={16} />, keywords: ["add"], run: go("/practice/mocks/new") },
      { id: "new-story", label: "New STAR story", icon: <BookOpenText size={16} />, keywords: ["behavioral", "add"], run: go("/practice/stories/new") },
      { id: "new-app", label: "Add an application", icon: <Briefcase size={16} />, keywords: ["job", "company", "pipeline"], run: go("/career/new") },
      { id: "new-resource", label: "Save a resource", icon: <Library size={16} />, keywords: ["link", "bookmark"], run: go("/resources/new") },
      { id: "session", label: "Start a study session", icon: <Zap size={16} />, keywords: ["focus", "study"], run: go("/session") },
      {
        id: "timer",
        label: isTimerVisible ? "Hide interview timer" : "Show interview timer",
        icon: <Timer size={16} />,
        keywords: ["stopwatch", "countdown"],
        run: () => {
          setIsTimerVisible(!isTimerVisible);
          onOpenChange(false);
        },
      },
      {
        id: "theme",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: <Moon size={16} />,
        keywords: ["appearance", "dark", "light"],
        run: () => {
          toggleTheme();
          onOpenChange(false);
        },
      },
      ...extensions.actions.map(a => ({
        ...a,
        run: () => {
          a.run();
          onOpenChange(false);
        },
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, isTimerVisible, extensions],
  );

  const entities: Array<{ heading: string; items: PaletteItem[] }> = useMemo(() => {
    const tasks = state.weeks.flatMap(w =>
      w.tasks.map(t => ({
        id: `task-${t.id}`,
        label: t.title,
        hint: w.title,
        icon: <CheckSquare size={16} />,
        run: go(`/plan#task-${t.id}`),
      })),
    );
    return [
      ...extensions.groups,
      {
        heading: "Lessons",
        items: LESSONS.map(l => ({
          id: `lesson-${l.id}`,
          label: l.title,
          hint: state.lessonProgress[l.id]?.doneAt ? "Done" : `${l.minutes} min`,
          icon: <GraduationCap size={16} />,
          keywords: [l.track, l.skill, "learn", "lesson"],
          run: go(lessonPath(l)),
        })),
      },
      {
        heading: "Notes",
        items: state.notes.map(n => ({
          id: `note-${n.id}`,
          label: n.title || "Untitled note",
          hint: n.tags.slice(0, 2).join(", "),
          icon: <StickyNote size={16} />,
          keywords: n.tags,
          run: go(`/notes/${n.id}`),
        })),
      },
      {
        heading: "Problems",
        items: state.dsaProblems.map(p => ({
          id: `dsa-${p.id}`,
          label: p.name,
          hint: p.difficulty,
          icon: <Code2 size={16} />,
          keywords: p.topics,
          run: go(`/practice/problems/${p.id}`),
        })),
      },
      {
        heading: "Stories",
        items: state.storyCards.map(st => ({
          id: `story-${st.id}`,
          label: st.title,
          icon: <BookOpenText size={16} />,
          keywords: st.tags,
          run: go(`/practice/stories/${st.id}`),
        })),
      },
      {
        heading: "System design topics",
        items: state.sdTopics.map(t => ({
          id: `sd-${t.id}`,
          label: t.title,
          hint: t.category,
          icon: <Network size={16} />,
          run: go(`/learn/system-design/topics/${t.id}`),
        })),
      },
      {
        heading: "Applications",
        items: state.applications.map(a => ({
          id: `app-${a.id}`,
          label: `${a.company} · ${a.role}`,
          hint: a.status,
          icon: <Briefcase size={16} />,
          run: go(`/career/${a.id}`),
        })),
      },
      {
        heading: "Mock interviews",
        items: state.mockInterviews.map(m => ({
          id: `mock-${m.id}`,
          label: `${m.type} mock · ${m.date}`,
          hint: `${m.score}/10`,
          icon: <Mic size={16} />,
          run: go(`/practice/mocks/${m.id}`),
        })),
      },
      {
        heading: "Resources",
        items: state.resources.map(r => ({
          id: `res-${r.id}`,
          label: r.title,
          hint: r.type,
          icon: <Library size={16} />,
          keywords: r.tags,
          run: go(`/resources/${r.id}`),
        })),
      },
      { heading: "Campaign tasks", items: tasks },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.notes,
    state.dsaProblems,
    state.storyCards,
    state.sdTopics,
    state.applications,
    state.mockInterviews,
    state.resources,
    state.weeks,
    state.lessonProgress,
    extensions,
  ]);

  const renderItem = (item: PaletteItem) => (
    <Command.Item key={item.id} value={`${item.label} ${item.id}`} keywords={item.keywords} onSelect={item.run} className={s.item}>
      <span className={s.itemIcon} aria-hidden>
        {item.icon}
      </span>
      <span className={s.itemLabel}>{item.label}</span>
      {item.hint && <span className={s.itemHint}>{item.hint}</span>}
    </Command.Item>
  );

  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className={overlay.backdrop} style={{ zIndex: "var(--z-palette)" }} />
        <RDialog.Content className={s.content} aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <RDialog.Title>Command palette</RDialog.Title>
          </VisuallyHidden.Root>
          <Command label="Command palette" loop>
            <div className={s.inputRow}>
              <Search size={18} aria-hidden />
              <Command.Input className={s.input} placeholder="Search everything, or type a command…" autoFocus />
            </div>
            <Command.List className={s.list}>
              <Command.Empty className={s.empty}>Nothing matches. Try a lesson, problem, note or company name.</Command.Empty>
              <Command.Group heading="Actions" className={s.group}>
                {actions.map(renderItem)}
              </Command.Group>
              <Command.Group heading="Go to" className={s.group}>
                {ALL_NAV_ITEMS.map(item =>
                  renderItem({
                    id: `nav-${item.to}`,
                    label: item.label,
                    hint: "Page",
                    icon: <item.icon size={16} />,
                    run: go(item.to),
                  }),
                )}
              </Command.Group>
              {entities
                .filter(g => g.items.length)
                .map(g => (
                  <Command.Group key={g.heading} heading={g.heading} className={s.group}>
                    {g.items.map(renderItem)}
                  </Command.Group>
                ))}
            </Command.List>
            <div className={s.footer}>
              <span>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> to move
              </span>
              <span>
                <Kbd>Enter</Kbd> to open
              </span>
              <span>
                <Kbd>Esc</Kbd> to close
              </span>
              <span style={{ marginLeft: "auto" }}>
                <Plus size={12} aria-hidden /> Actions work from anywhere
              </span>
            </div>
          </Command>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
