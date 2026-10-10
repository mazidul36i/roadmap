import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, BarChart3, Check, Code2, ExternalLink, MoreHorizontal, Plus, RefreshCw, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import type { DSAProblem } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { useConfirm } from "@context/ConfirmationContext";
import { Badge, Button, ButtonLink, Card, CardHeader, Chip, EmptyState, IconButton, Input, Menu, PageHeader, Select, Stat } from "@ui/index";
import { DIFFICULTY_TONE } from "@content/taxonomy";
import { LESSON_BY_ID, lessonsForTrack } from "@content/catalog";
import { problemSkills } from "@lib/mastery";
import { formatRelative, lastNDays, localDateKey } from "@lib/dates";
import { LeetCodeError, syncAccepted } from "@lib/leetcode";
import { AIResponse, AiGate } from "@features/copilot/AIResponse";
import { useAiText } from "@features/copilot/useAi";
import { DIFF_ORDER, resolveQueue } from "./problemUtils";
import s from "./Problems.module.css";

type SortKey = "added" | "name" | "difficulty" | "solved";
const DSA_SKILLS = lessonsForTrack("dsa");

export default function ProblemsPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [syncing, setSyncing] = useState<string | null>(null);
  const insights = useAiText("progress_insights");

  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const diff = params.get("diff") ?? "";
  const skill = params.get("skill") ?? "";
  const sort = (params.get("sort") as SortKey) ?? "added";
  const dir = params.get("dir") === "asc" ? "asc" : "desc";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const problems = state.dsaProblems;
  const today = localDateKey();
  const resolve = useMemo(() => resolveQueue(problems, today), [problems, today]);
  const resolveIds = new Set(resolve.map(p => p.id));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = problems.filter(p => {
      if (needle && !p.name.toLowerCase().includes(needle) && !p.topics.some(t => t.toLowerCase().includes(needle))) return false;
      if (status === "solved" && !p.solved) return false;
      if (status === "unsolved" && p.solved) return false;
      if (status === "resolve" && !resolveIds.has(p.id)) return false;
      if (diff && p.difficulty !== diff) return false;
      if (skill && !problemSkills(p).includes(skill)) return false;
      return true;
    });
    const factor = dir === "asc" ? 1 : -1;
    const key = (p: DSAProblem): string | number =>
      sort === "name" ? p.name.toLowerCase() : sort === "difficulty" ? DIFF_ORDER[p.difficulty] : sort === "solved" ? p.solvedAt ?? "" : p.addedAt ?? "";
    // "added" keeps insertion order (newest first) when dates tie or are missing.
    return sort === "added" && dir === "desc" ? list : [...list].sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * factor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, q, status, diff, skill, sort, dir, resolve]);

  const solved = problems.filter(p => p.solved);
  const byDiff = (d: string) => solved.filter(p => p.difficulty === d).length;
  const week = new Set(lastNDays(7, today));
  const solvedThisWeek = solved.filter(p => p.solvedAt && week.has(p.solvedAt)).length;

  const skillCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of solved) for (const sk of problemSkills(p)) counts.set(sk, (counts.get(sk) ?? 0) + 1);
    return DSA_SKILLS.map(l => ({ id: l.id, title: l.title, n: counts.get(l.id) ?? 0 }));
  }, [solved]);
  const maxSkill = Math.max(1, ...skillCounts.map(c => c.n));

  const toggleSolved = (p: DSAProblem) => dispatch({ type: "UPDATE_DSA", problem: { ...p, solved: !p.solved, solvedAt: p.solved ? undefined : p.solvedAt } });

  const logResolve = (p: DSAProblem) => {
    dispatch({ type: "UPDATE_DSA", problem: { ...p, attempts: [...(p.attempts ?? []), { date: today, solved: true, minutes: 0 }] } });
    dispatch({ type: "AWARD", key: `resolve:${p.id}`, kind: "problem", xp: 15 });
    toast(`Re-solved ${p.name}`, "success", { detail: "It drops out of the re-solve queue for two weeks." });
  };

  const remove = async (p: DSAProblem) => {
    if (await confirm({ title: `Delete “${p.name}”?`, message: "Its notes and attempts are removed too. This can't be undone.", type: "danger" })) {
      dispatch({ type: "DELETE_DSA", id: p.id });
    }
  };

  const sync = async () => {
    if (!state.leetcodeUsername) return;
    setSyncing("Contacting LeetCode…");
    try {
      const res = await syncAccepted(state.leetcodeUsername, problems, (done, total) => setSyncing(total ? `Importing ${done}/${total}…` : "Checking…"));
      if (res.added.length) dispatch({ type: "ADD_DSA_BULK", problems: res.added });
      for (const p of res.markedSolved) dispatch({ type: "UPDATE_DSA", problem: p });
      dispatch({ type: "SET_LEETCODE_SYNCED", at: new Date().toISOString() });
      const n = res.added.length + res.markedSolved.length;
      toast(n ? `Synced ${n} problem${n > 1 ? "s" : ""} from LeetCode` : "Already up to date", n ? "success" : "info", {
        detail: res.skipped ? `${res.skipped} more waiting. Sync again to import them.` : undefined,
      });
    } catch (e) {
      toast(e instanceof LeetCodeError ? e.message : "LeetCode sync failed", "error");
    } finally {
      setSyncing(null);
    }
  };

  const sortHeader = (key: SortKey, label: string) => {
    const active = sort === key;
    return (
      <th aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          className={s.sortBtn}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set("sort", key);
            next.set("dir", active && dir === "desc" ? "asc" : "desc");
            setParams(next, { replace: true });
          }}
        >
          {label}
          {active && (dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
        </button>
      </th>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Problems"
        subtitle="Your practice log. Solving here feeds pattern mastery, XP and the re-solve queue."
        actions={
          <>
            {state.leetcodeUsername ? (
              <Button icon={<RefreshCw size={16} className={syncing ? "spin" : undefined} />} onClick={sync} loading={false} disabled={!!syncing}>
                {syncing ?? "Sync LeetCode"}
              </Button>
            ) : (
              <ButtonLink to="/settings#integrations" variant="ghost">
                Link LeetCode
              </ButtonLink>
            )}
            <ButtonLink to="/practice/problems/new" variant="primary" icon={<Plus size={16} />}>
              Log a problem
            </ButtonLink>
          </>
        }
      />

      <div className={s.summary}>
        <Card padding="compact">
          <Stat label="Solved" value={solved.length} icon={<Code2 size={15} />} accent="var(--track-dsa)" hint={`${byDiff("Easy")} easy · ${byDiff("Medium")} medium · ${byDiff("Hard")} hard`} />
          <div className={s.diffBars} aria-hidden>
            <span style={{ width: `${(byDiff("Easy") / Math.max(1, solved.length)) * 100}%`, background: "var(--success)" }} />
            <span style={{ width: `${(byDiff("Medium") / Math.max(1, solved.length)) * 100}%`, background: "var(--warning)" }} />
            <span style={{ width: `${(byDiff("Hard") / Math.max(1, solved.length)) * 100}%`, background: "var(--danger)" }} />
          </div>
        </Card>
        <Card padding="compact">
          <Stat label="This week" value={solvedThisWeek} hint="solved in the last 7 days" />
        </Card>
        <Card padding="compact">
          <Stat label="To re-solve" value={resolve.length} icon={<RotateCcw size={15} />} accent="var(--xp)" hint="older than 2 weeks, hard or with mistakes" />
        </Card>
        <Card padding="compact">
          <Stat label="Tracked" value={problems.length} hint={`${problems.length - solved.length} still open`} />
        </Card>
      </div>

      <div className={s.layout}>
        <div>
          <div className={s.filters} role="search">
            <Input className={s.search} icon={<Search size={16} />} placeholder="Search problems or topics" value={q} onChange={e => setParam("q", e.target.value)} aria-label="Search problems" />
            <Select
              value={skill}
              onChange={e => setParam("skill", e.target.value)}
              aria-label="Filter by pattern"
              options={[{ value: "", label: "All patterns" }, ...DSA_SKILLS.map(l => ({ value: l.id, label: l.title }))]}
              style={{ width: "auto" }}
            />
          </div>
          <div className={s.filters} role="group" aria-label="Filters">
            {[
              ["all", "All"],
              ["unsolved", "Open"],
              ["solved", "Solved"],
              ["resolve", "Re-solve"],
            ].map(([value, label]) => (
              <Chip key={value} selected={status === value} onClick={() => setParam("status", value === "all" ? "" : value)} count={value === "resolve" ? resolve.length : undefined}>
                {label}
              </Chip>
            ))}
            <span style={{ width: 8 }} />
            {(["Easy", "Medium", "Hard"] as const).map(d => (
              <Chip key={d} selected={diff === d} onClick={() => setParam("diff", diff === d ? "" : d)}>
                {d}
              </Chip>
            ))}
          </div>

          {problems.length === 0 ? (
            <EmptyState icon={<Code2 size={26} />} title="No problems logged yet" actions={<ButtonLink to="/practice/problems/new" variant="primary">Log your first problem</ButtonLink>}>
              Log problems as you solve them, or link LeetCode in Settings to import your accepted submissions.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Search size={26} />} title="Nothing matches these filters" actions={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>} />
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>
                      <span className="sr-only">Solved</span>
                    </th>
                    {sortHeader("name", "Problem")}
                    <th className={s.hideSm}>Patterns</th>
                    {sortHeader("difficulty", "Level")}
                    <th className={s.hideSm}>
                      <button
                        type="button"
                        className={s.sortBtn}
                        onClick={() => {
                          const next = new URLSearchParams(params);
                          next.set("sort", "solved");
                          next.set("dir", sort === "solved" && dir === "desc" ? "asc" : "desc");
                          setParams(next, { replace: true });
                        }}
                      >
                        Solved
                      </button>
                    </th>
                    <th style={{ width: 88 }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const skills = problemSkills(p);
                    return (
                      <tr key={p.id}>
                        <td>
                          <button type="button" role="checkbox" aria-checked={p.solved} aria-label={`${p.solved ? "Mark unsolved" : "Mark solved"}: ${p.name}`} className={s.check} onClick={() => toggleSolved(p)}>
                            <Check size={15} strokeWidth={3} />
                          </button>
                        </td>
                        <td>
                          <Link to={`/practice/problems/${p.id}`} className={s.name}>
                            {p.name}
                          </Link>
                          {resolveIds.has(p.id) && (
                            <Badge tone="xp" className="u-hide-sm">
                              re-solve
                            </Badge>
                          )}
                          {p.mistakes?.trim() && <span className={s.mistake}>{p.mistakes}</span>}
                        </td>
                        <td className={s.hideSm}>
                          <div className={s.skills}>
                            {skills.length
                              ? skills.slice(0, 2).map(sk => (
                                  <Link key={sk} to={`/learn/dsa/${sk}`} className={s.skillChip}>
                                    {LESSON_BY_ID[sk]?.title.split(/[:(&]/)[0].trim() ?? sk}
                                  </Link>
                                ))
                              : p.topics.slice(0, 2).map(t => (
                                  <span key={t} className={s.muted}>
                                    {t}
                                  </span>
                                ))}
                          </div>
                        </td>
                        <td>
                          <Badge tone={DIFFICULTY_TONE[p.difficulty]}>{p.difficulty}</Badge>
                        </td>
                        <td className={`${s.hideSm} ${s.muted}`}>{p.solvedAt ? formatRelative(p.solvedAt) : p.solved ? "Solved" : "–"}</td>
                        <td>
                          <div className="u-row" style={{ gap: 2, justifyContent: "flex-end" }}>
                            {p.url && (
                              <IconButton label="Open on the platform" size="sm" icon={<ExternalLink size={15} />} onClick={() => window.open(p.url, "_blank", "noopener")} />
                            )}
                            <Menu
                              trigger={<IconButton label={`More actions for ${p.name}`} size="sm" icon={<MoreHorizontal size={16} />} tooltip={false} />}
                              items={[
                                { label: "Open workspace", icon: <Code2 size={15} />, onSelect: () => navigate(`/practice/problems/${p.id}`) },
                                ...(p.solved ? [{ label: "Log a re-solve", icon: <RotateCcw size={15} />, onSelect: () => logResolve(p) }] : []),
                                "separator" as const,
                                { label: "Delete", icon: <Trash2 size={15} />, danger: true, onSelect: () => void remove(p) },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className={s.side}>
          {resolve.length > 0 && (
            <Card accent="var(--xp)">
              <CardHeader title="Due for a re-solve" icon={<RotateCcw size={18} />} subtitle="Solving again without notes is the fastest way to make a pattern stick." />
              <ul>
                {resolve.slice(0, 5).map(p => (
                  <li key={p.id} className={s.resolve}>
                    <Link to={`/practice/problems/${p.id}`} className="u-grow u-truncate" style={{ color: "var(--text)" }}>
                      {p.name}
                    </Link>
                    <Button size="sm" variant="soft" onClick={() => logResolve(p)}>
                      Done +15
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader title="Solved by pattern" icon={<BarChart3 size={18} />} />
            <div className="u-stack" style={{ ["--stack-gap" as string]: "6px" }}>
              {skillCounts.map(c => (
                <Link key={c.id} to={`?skill=${c.id}`} className={s.skillRow} aria-label={`${c.title}: ${c.n} solved`}>
                  <span className="u-truncate">{c.title}</span>
                  <span style={{ height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${(c.n / maxSkill) * 100}%`, background: "var(--track-dsa)" }} />
                  </span>
                  <span style={{ textAlign: "right" }}>{c.n}</span>
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Practice insights" icon={<Sparkles size={18} />} subtitle="AI reads your log: weak spots, next problems, one habit to change." />
            {!insights.enabled ? (
              <AiGate />
            ) : insights.status === "idle" ? (
              <Button
                variant="soft"
                icon={<Sparkles size={16} />}
                onClick={() =>
                  insights.run({ problems: problems.map(p => ({ name: p.name, topics: p.topics, difficulty: p.difficulty, mistakes: p.mistakes || undefined, solved: p.solved })) })
                }
                disabled={!problems.length}
              >
                Analyse my practice
              </Button>
            ) : (
              <AIResponse text={insights.text} status={insights.status} error={insights.error} onRetry={insights.retry} onStop={insights.stop} saveTitle="Practice insights" />
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
