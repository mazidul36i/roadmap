import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { Flashcard, TrackId } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { useConfirm } from "@context/ConfirmationContext";
import { Badge, Button, Card, CardHeader, Dialog, EmptyState, Field, IconButton, Select, Stat, Textarea } from "@ui/index";
import { TRACKS } from "@content/taxonomy";
import { autoCards, sourceOf, type DeckSource } from "@lib/deck";
import { isDue, isNew } from "@lib/srs";
import { AiGate } from "@features/copilot/AIResponse";
import { useAiJson } from "@features/copilot/useAi";
import s from "./Review.module.css";

const TRACK_OPTIONS = [{ value: "general", label: "General" }, ...TRACKS.map(t => ({ value: t.id, label: t.short }))];
const SOURCE_LABEL: Record<DeckSource, string> = { lesson: "Lesson cards", problem: "Problem cards", story: "Story cards", mock: "Mock cards", user: "Your cards" };

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function CardsManager() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [track, setTrack] = useState<TrackId | "general">("general");
  const [editing, setEditing] = useState<Flashcard | null>(null);

  const composition = useMemo(() => {
    const counts: Record<DeckSource, { total: number; due: number }> = {
      lesson: { total: 0, due: 0 },
      problem: { total: 0, due: 0 },
      story: { total: 0, due: 0 },
      mock: { total: 0, due: 0 },
      user: { total: 0, due: 0 },
    };
    const now = new Date();
    for (const [key, cs] of Object.entries(state.srs)) {
      const src = sourceOf(key);
      if (src === "lesson") {
        counts.lesson.total++;
        if (!isNew(cs) && isDue(cs, now)) counts.lesson.due++;
      }
    }
    for (const c of autoCards(state)) {
      const src = sourceOf(c.key);
      counts[src].total++;
      const cs = state.srs[c.key];
      if (cs && !isNew(cs) && isDue(cs, now)) counts[src].due++;
    }
    counts.user.total = state.userCards.length;
    counts.user.due = state.userCards.filter(c => {
      const cs = state.srs[`user:${c.id}`];
      return cs && !isNew(cs) && isDue(cs, now);
    }).length;
    return counts;
  }, [state]);

  const add = () => {
    if (!front.trim() || !back.trim()) return;
    dispatch({
      type: "ADD_USER_CARDS",
      cards: [{ id: uid(), front: front.trim(), back: back.trim(), track, tags: [], type: "basic", source: { type: "manual" }, createdAt: new Date().toISOString() }],
    });
    setFront("");
    setBack("");
    toast("Card added to your deck", "success");
  };

  const remove = async (c: Flashcard) => {
    if (await confirm({ title: "Delete this card?", message: "Its review history goes with it.", type: "danger" })) dispatch({ type: "DELETE_USER_CARD", id: c.id });
  };

  return (
    <div className={s.manage}>
      <div className="u-stack" style={{ ["--stack-gap" as string]: "20px" }}>
        <Card>
          <CardHeader title="Your deck" icon={<Layers size={20} />} subtitle="Where your cards come from. Due counts are reviews waiting now." />
          <div className={s.sourceGrid}>
            {(Object.keys(composition) as DeckSource[]).map(src => (
              <Stat key={src} label={SOURCE_LABEL[src]} value={composition[src].total} hint={composition[src].due ? `${composition[src].due} due` : "none due"} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cards you wrote" subtitle={`${state.userCards.length} card${state.userCards.length === 1 ? "" : "s"}. Tip: wrap a phrase in {{double braces}} to make a cloze card.`} />
          {state.userCards.length === 0 ? (
            <EmptyState icon={<Pencil size={22} />} title="No cards of your own yet">
              Write one on the right, or generate a handful from a note with AI.
            </EmptyState>
          ) : (
            <ul className={s.cardList}>
              {state.userCards.map(c => (
                <li key={c.id} className={s.cardRow}>
                  <div style={{ minWidth: 0 }}>
                    <div className={s.cardFront}>{c.front}</div>
                    <div className={`${s.cardBack} u-clamp-2`}>{c.back}</div>
                    <div className="u-row" style={{ gap: 6, marginTop: 6 }}>
                      <Badge color={`var(--track-${c.track})`}>{TRACK_OPTIONS.find(t => t.value === c.track)?.label}</Badge>
                      {c.source?.type === "ai" && <Badge tone="brand">AI</Badge>}
                    </div>
                  </div>
                  <div className="u-row" style={{ gap: 2 }}>
                    <IconButton size="sm" label="Edit card" icon={<Pencil size={15} />} onClick={() => setEditing(c)} />
                    <IconButton size="sm" label="Delete card" icon={<Trash2 size={15} />} onClick={() => void remove(c)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="u-stack" style={{ ["--stack-gap" as string]: "20px" }}>
        <Card>
          <CardHeader title="Write a card" icon={<Plus size={20} />} />
          <Field label="Front" hint="A question or prompt. One idea per card.">
            <Textarea value={front} onChange={e => setFront(e.target.value)} rows={3} placeholder="When does a sliding window break down?" />
          </Field>
          <Field label="Back">
            <Textarea value={back} onChange={e => setBack(e.target.value)} rows={3} placeholder="When validity isn't monotonic, e.g. sums with negative numbers." />
          </Field>
          <Field label="Track">
            <Select value={track} onChange={e => setTrack(e.target.value as TrackId | "general")} options={TRACK_OPTIONS} />
          </Field>
          <Button variant="primary" icon={<Plus size={16} />} onClick={add} disabled={!front.trim() || !back.trim()}>
            Add to deck
          </Button>
        </Card>
        <GenerateCards />
      </div>

      <EditCardDialog card={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditCardDialog({ card, onClose }: { card: Flashcard | null; onClose: () => void }) {
  const { dispatch } = useApp();
  const [draft, setDraft] = useState<Flashcard | null>(card);
  if (card && draft?.id !== card.id) setDraft(card);
  return (
    <Dialog
      open={!!card}
      onOpenChange={o => !o && onClose()}
      title="Edit card"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (draft) dispatch({ type: "UPDATE_USER_CARD", card: draft });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      {draft && (
        <div className="u-stack">
          <Field label="Front">
            <Textarea value={draft.front} onChange={e => setDraft({ ...draft, front: e.target.value })} rows={3} />
          </Field>
          <Field label="Back">
            <Textarea value={draft.back} onChange={e => setDraft({ ...draft, back: e.target.value })} rows={4} />
          </Field>
          <Field label="Track">
            <Select value={draft.track} onChange={e => setDraft({ ...draft, track: e.target.value as Flashcard["track"] })} options={TRACK_OPTIONS} />
          </Field>
        </div>
      )}
    </Dialog>
  );
}

interface Proposal {
  front: string;
  back: string;
  keep: boolean;
}

function GenerateCards() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const gen = useAiJson("cards_from_text");
  const [noteId, setNoteId] = useState("");
  const [pasted, setPasted] = useState("");
  const [count, setCount] = useState("6");
  const [track, setTrack] = useState<TrackId | "general">("general");
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const note = state.notes.find(n => n.id === noteId);
  const sourceText = note ? stripHtml(note.content) : pasted;

  const run = async () => {
    const out = await gen.run({ title: note?.title, text: sourceText.slice(0, 30000), count: Number(count) });
    if (out) setProposals(out.cards.map(c => ({ ...c, keep: true })));
  };

  const accept = () => {
    const chosen = proposals.filter(p => p.keep && p.front.trim() && p.back.trim());
    if (!chosen.length) return;
    dispatch({
      type: "ADD_USER_CARDS",
      cards: chosen.map(p => ({
        id: uid(),
        front: p.front.trim(),
        back: p.back.trim(),
        track,
        tags: note ? [note.title] : [],
        type: "basic",
        source: { type: "ai", id: note?.id },
        createdAt: new Date().toISOString(),
      })),
    });
    toast(`${chosen.length} card${chosen.length > 1 ? "s" : ""} added`, "success");
    setProposals([]);
    gen.reset();
  };

  return (
    <Card accent="var(--brand)">
      <CardHeader title="Generate from notes" icon={<Sparkles size={20} />} subtitle="AI drafts atomic cards. You approve every one." />
      {!gen.enabled ? (
        <AiGate />
      ) : proposals.length ? (
        <div className="u-stack" style={{ ["--stack-gap" as string]: "10px" }}>
          {proposals.map((p, i) => (
            <label key={i} className={s.proposal}>
              <input type="checkbox" checked={p.keep} onChange={e => setProposals(ps => ps.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} />
              <div className="u-stack" style={{ ["--stack-gap" as string]: "6px" }}>
                <Textarea value={p.front} rows={2} aria-label={`Card ${i + 1} front`} onChange={e => setProposals(ps => ps.map((x, j) => (j === i ? { ...x, front: e.target.value } : x)))} />
                <Textarea value={p.back} rows={2} aria-label={`Card ${i + 1} back`} onChange={e => setProposals(ps => ps.map((x, j) => (j === i ? { ...x, back: e.target.value } : x)))} />
              </div>
            </label>
          ))}
          <div className="u-cluster">
            <Button variant="primary" onClick={accept}>
              Add {proposals.filter(p => p.keep).length} cards
            </Button>
            <Button variant="ghost" onClick={() => setProposals([])}>
              Discard
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Field label="From a note">
            <Select value={noteId} onChange={e => setNoteId(e.target.value)} options={[{ value: "", label: "Paste text instead" }, ...state.notes.map(n => ({ value: n.id, label: n.title || "Untitled note" }))]} />
          </Field>
          {!note && (
            <Field label="Text">
              <Textarea value={pasted} onChange={e => setPasted(e.target.value)} rows={5} placeholder="Paste study material, docs, or your own summary." />
            </Field>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="How many">
              <Select value={count} onChange={e => setCount(e.target.value)} options={["3", "6", "10", "15"]} />
            </Field>
            <Field label="Track">
              <Select value={track} onChange={e => setTrack(e.target.value as TrackId | "general")} options={TRACK_OPTIONS} />
            </Field>
          </div>
          {gen.error && (
            <p className="u-sm" role="alert" style={{ color: "var(--danger)" }}>
              {gen.error}
            </p>
          )}
          <Button variant="soft" icon={<Wand2 size={16} />} onClick={run} loading={gen.status === "loading"} disabled={sourceText.trim().length < 40}>
            Draft cards
          </Button>
        </>
      )}
    </Card>
  );
}
