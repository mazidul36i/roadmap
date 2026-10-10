import { useRef, useState, type CSSProperties } from "react";
import {
  BrainCircuit,
  CalendarRange,
  Database,
  Download,
  Link2,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
  Upload,
  UserRound,
} from "lucide-react";
import { useApp } from "@context/AppContext";
import { useAuth } from "@context/AuthContext";
import { useTheme } from "@context/ThemeContext";
import { useToast } from "@context/ToastContext";
import { useConfirm } from "@context/ConfirmationContext";
import { Button, Card, CardHeader, Chip, Field, Input, PageHeader, ProgressBar, Segmented, Select, Switch } from "@ui/index";
import { TRACKS } from "@content/taxonomy";
import { DOC_WARN_BYTES, migrate } from "@lib/migrate";
import { formatRelative, localDateKey } from "@lib/dates";
import { initials } from "@lib/selectors";
import type { ThemePreference, TrackId } from "@app-types/index";
import s from "./SettingsPage.module.css";

const SECTIONS = [
  { id: "profile", label: "Profile & campaign", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "ai", label: "AI co-pilot", icon: BrainCircuit },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "data", label: "Data & backup", icon: Database },
  { id: "account", label: "Account", icon: LogOut },
] as const;

const DOC_LIMIT = 1024 * 1024;

export default function SettingsPage() {
  const { state, dispatch, docBytes } = useApp();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [leetcode, setLeetcode] = useState(state.leetcodeUsername ?? "");
  const { profile } = state;

  const toggleTrack = (id: TrackId) => {
    const has = profile.tracks.includes(id);
    if (has && profile.tracks.length === 1) {
      toast("Keep at least one track active", "info");
      return;
    }
    dispatch({
      type: "UPDATE_PROFILE",
      updates: { tracks: has ? profile.tracks.filter(t => t !== id) : [...profile.tracks, id] },
    });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge-backup-${localDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded", "success", { detail: a.download });
  };

  const importData = async (file: File) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast("That file isn't valid JSON", "error", { detail: "Choose a backup exported from Forge or Roadmap Tracker." });
      return;
    }
    if (typeof parsed !== "object" || parsed === null || !("weeks" in parsed || "dsaProblems" in parsed)) {
      toast("That doesn't look like a Forge backup", "error");
      return;
    }
    const preview = migrate(parsed);
    const ok = await confirm({
      title: "Replace everything with this backup?",
      message: `It has ${preview.dsaProblems.length} problems, ${preview.notes.length} notes, ${preview.storyCards.length} stories and ${preview.weeks.length} sprints. Your current data will be overwritten. Export a backup first if you're unsure.`,
      confirmText: "Import and replace",
      type: "danger",
    });
    if (!ok) return;
    dispatch({ type: "IMPORT_STATE", state: preview });
    toast("Backup imported", "success");
  };

  const signOut = async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "Your progress is saved to the cloud. You can sign back in any time.",
      confirmText: "Sign out",
    });
    if (ok) await logout();
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Tune your campaign, appearance, AI and data." />
      <div className={s.layout}>
        <nav className={s.toc} aria-label="Settings sections">
          {SECTIONS.map(sec => (
            <a key={sec.id} href={`#${sec.id}`} className={s.tocLink}>
              <sec.icon size={16} aria-hidden />
              {sec.label}
            </a>
          ))}
        </nav>

        <div className={s.sections}>
          <Card as="section" id="profile" className={s.section}>
            <CardHeader title="Profile & campaign" icon={<CalendarRange size={20} />} subtitle="What you're preparing for and how fast." />
            <div className={s.profileRow}>
              <span className={s.avatar} aria-hidden>
                {initials(user?.displayName || user?.email)}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{user?.displayName || "Unnamed forger"}</div>
                <div className="u-sm u-muted">{user?.email}</div>
              </div>
            </div>
            <div className={s.grid2}>
              <Field label="Target role" hint="Shapes AI interview questions and suggestions.">
                <Input
                  value={profile.targetRole}
                  onChange={e => dispatch({ type: "UPDATE_PROFILE", updates: { targetRole: e.target.value } })}
                  placeholder="Senior Backend Engineer"
                />
              </Field>
              <Field label="Goal">
                <Select
                  value={profile.goal}
                  onChange={e => dispatch({ type: "UPDATE_PROFILE", updates: { goal: e.target.value as "job-switch" | "upskill" } })}
                  options={[
                    { value: "job-switch", label: "Switching jobs (interviewing)" },
                    { value: "upskill", label: "Upskilling (no deadline)" },
                  ]}
                />
              </Field>
              <Field label="Campaign start" hint="Sprints are counted in weeks from this date.">
                <Input type="date" value={state.startDate} onChange={e => e.target.value && dispatch({ type: "SET_START_DATE", date: e.target.value })} />
              </Field>
              <Field label="Target date" hint="Optional. Powers the countdown on Today.">
                <Input
                  type="date"
                  value={profile.targetDate ?? ""}
                  min={state.startDate}
                  onChange={e => dispatch({ type: "UPDATE_PROFILE", updates: { targetDate: e.target.value || undefined } })}
                />
              </Field>
              <Field label="Daily XP goal" hint="A streak day needs 30 XP; the goal ring fills at this amount.">
                <Select
                  value={String(profile.dailyGoalXp)}
                  onChange={e => dispatch({ type: "UPDATE_PROFILE", updates: { dailyGoalXp: Number(e.target.value) } })}
                  options={[
                    { value: "50", label: "50 XP · light" },
                    { value: "100", label: "100 XP · steady" },
                    { value: "150", label: "150 XP · serious" },
                    { value: "250", label: "250 XP · intense" },
                  ]}
                />
              </Field>
            </div>
            <div>
              <div className="u-sm" style={{ fontWeight: 600, marginBottom: 8 }}>
                Active tracks
              </div>
              <div className={s.trackChips} role="group" aria-label="Active tracks">
                {TRACKS.map(t => (
                  <Chip
                    key={t.id}
                    selected={profile.tracks.includes(t.id)}
                    onClick={() => toggleTrack(t.id)}
                    icon={<span className={s.dot} style={{ "--accent": `var(${t.colorVar})` } as CSSProperties} aria-hidden />}
                  >
                    {t.short}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          <Card as="section" id="appearance" className={s.section}>
            <CardHeader title="Appearance" icon={<Palette size={20} />} />
            <div className={s.row}>
              <div>
                <div style={{ fontWeight: 600 }}>Theme</div>
                <div className={s.note}>System follows your operating system's setting.</div>
              </div>
              <Segmented<ThemePreference>
                label="Theme"
                value={preference}
                onValueChange={setPreference}
                options={[
                  { value: "dark", label: "Dark", icon: <Moon size={14} /> },
                  { value: "light", label: "Light", icon: <Sun size={14} /> },
                  { value: "system", label: "System", icon: <Monitor size={14} /> },
                ]}
              />
            </div>
          </Card>

          <Card as="section" id="ai" className={s.section}>
            <CardHeader title="AI co-pilot" icon={<BrainCircuit size={20} />} subtitle="Tutor, hints, mock interviewer and card generation." />
            <Switch
              label="Enable AI features"
              description="When off, every feature still works without AI and nothing is sent to a model."
              checked={!!state.aiEnabled}
              onCheckedChange={enabled => {
                dispatch({ type: "SET_AI_ENABLED", enabled });
                toast(enabled ? "AI co-pilot on" : "AI co-pilot off", "info");
              }}
            />
          </Card>

          <Card as="section" id="integrations" className={s.section}>
            <CardHeader title="Integrations" icon={<Link2 size={20} />} />
            <form
              onSubmit={e => {
                e.preventDefault();
                dispatch({ type: "SET_LEETCODE_USERNAME", username: leetcode });
                toast(leetcode.trim() ? "LeetCode account linked" : "LeetCode account unlinked", "success");
              }}
              className="u-stack"
            >
              <Field
                label="LeetCode username"
                hint={
                  state.leetcodeLastSync
                    ? `Last synced ${formatRelative(state.leetcodeLastSync)}. Used only to import your accepted submissions via a public API.`
                    : "Used only to import your accepted submissions via a public API."
                }
              >
                <Input value={leetcode} onChange={e => setLeetcode(e.target.value)} placeholder="your-handle" autoComplete="off" />
              </Field>
              <div>
                <Button type="submit" variant="secondary" disabled={leetcode.trim() === (state.leetcodeUsername ?? "")}>
                  Save username
                </Button>
              </div>
            </form>
          </Card>

          <Card as="section" id="data" className={s.section}>
            <CardHeader title="Data & backup" icon={<Database size={20} />} subtitle="Everything syncs to your private Firestore document." />
            <ProgressBar
              label="Cloud document size"
              value={docBytes}
              max={DOC_LIMIT}
              valueLabel={`${(docBytes / 1024).toFixed(0)} KB of 1024 KB`}
              color={docBytes > DOC_WARN_BYTES ? "var(--warning)" : "var(--success)"}
            />
            {docBytes > DOC_WARN_BYTES && (
              <p className={s.note} role="alert">
                You're approaching Firestore's 1 MB limit for a single document. Export a backup and consider pruning very long notes.
              </p>
            )}
            <div className="u-cluster">
              <Button icon={<Download size={16} />} onClick={exportData}>
                Export backup
              </Button>
              <Button icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>
                Import backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className={s.hiddenInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void importData(file);
                  e.target.value = "";
                }}
              />
            </div>
          </Card>

          <Card as="section" id="account" className={`${s.section} ${s.danger}`}>
            <CardHeader title="Account" icon={<LogOut size={20} />} />
            <div className={s.row}>
              <p className={s.note}>Signed in as {user?.email}.</p>
              <Button variant="danger" icon={<LogOut size={16} />} onClick={signOut}>
                Sign out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
