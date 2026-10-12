import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BookOpen, GraduationCap, MessagesSquare, RotateCcw, SendHorizontal, Sparkles } from "lucide-react";
import { Button, Chip, IconButton, Sheet, Switch, Textarea } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { useAi } from "./useAi";
import { AiGate } from "./AIResponse";
import { useTutor } from "./TutorContext";
import s from "./Copilot.module.css";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const GENERAL_SUGGESTIONS = [
  "Quiz me on a DSA pattern I'm weak at",
  "Explain consistent hashing like I'm in an interview",
  "How does ConcurrentHashMap stay thread-safe?",
  "Give me a 2-minute plan for today",
];

/** Context-aware tutor chat in a side drawer (Ctrl+J). */
export function TutorDrawer() {
  const { open, setOpen, context, pendingQuestion, clearPending } = useTutor();
  const ai = useAi();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [socratic, setSocratic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const contextKey = context ? `${context.kind}:${context.title}` : "general";
  const lastContext = useRef(contextKey);

  // A different page means a different conversation.
  useEffect(() => {
    if (lastContext.current !== contextKey && !busy) {
      lastContext.current = contextKey;
      setTurns([]);
      setError(null);
    }
  }, [contextKey, busy]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy || !ai.enabled) return;
    const history: Turn[] = [...turns, { role: "user", content: q }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setError(null);
    const ctrl = new AbortController();
    controller.current = ctrl;
    try {
      await ai.stream(
        "tutor",
        {
          messages: history.slice(-20),
          socratic,
          context: context ? { kind: context.kind, title: context.title, body: context.body } : undefined,
        },
        {
          signal: ctrl.signal,
          onText: t => setTurns([...history, { role: "assistant", content: t }]),
        },
      );
    } catch (e) {
      if (!ctrl.signal.aborted) {
        setError(e instanceof Error ? e.message : String(e));
        setTurns(history);
      }
    } finally {
      setBusy(false);
    }
  };

  // Questions sent from elsewhere ("Ask Forge about this").
  useEffect(() => {
    if (open && pendingQuestion && ai.enabled && !busy) {
      const q = pendingQuestion;
      clearPending();
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingQuestion, ai.enabled]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  };

  const suggestions = context?.suggestions?.length ? context.suggestions : GENERAL_SUGGESTIONS;

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Ask Forge"
      description="Your tutor knows what you're looking at."
      width={480}
      modal={false}
      headerExtra={
        turns.length > 0 ? (
          <IconButton
            label="New conversation"
            icon={<RotateCcw size={16} />}
            onClick={() => {
              controller.current?.abort();
              setTurns([]);
              setError(null);
            }}
          />
        ) : null
      }
    >
      <div className={s.tutor}>
        {context && (
          <div className={s.contextChip} title={context.title}>
            {context.kind === "lesson" ? <GraduationCap size={14} aria-hidden /> : <BookOpen size={14} aria-hidden />}
            <span>
              Looking at: <strong>{context.title ?? context.kind}</strong>
            </span>
          </div>
        )}

        {!ai.enabled ? (
          <AiGate>Turn on the AI co-pilot to chat with your tutor. Nothing is sent to a model while it's off.</AiGate>
        ) : (
          <>
            <div className={s.thread} ref={threadRef} aria-live="polite">
              {turns.length === 0 && (
                <div className={s.welcome}>
                  <h3>
                    <MessagesSquare size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} aria-hidden />
                    What should we work on?
                  </h3>
                  <p>Ask for an explanation, a quiz, a hint, or a code review. Turn on Socratic mode if you want to be guided instead of told.</p>
                  <div className={s.suggestions}>
                    {suggestions.map(q => (
                      <Chip key={q} onClick={() => void send(q)}>
                        {q}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {turns.map((t, i) =>
                t.role === "user" ? (
                  <div key={i} className={s.userBubble}>
                    {t.content}
                  </div>
                ) : (
                  <div key={i} className={s.assistantBubble}>
                    {t.content ? (
                      <Markdown streaming={busy && i === turns.length - 1}>{t.content}</Markdown>
                    ) : (
                      <span className="u-sm u-muted">
                        <Sparkles size={13} style={{ display: "inline", verticalAlign: "-2px" }} aria-hidden /> Thinking…
                      </span>
                    )}
                  </div>
                ),
              )}
              {error && (
                <p className="u-sm" role="alert" style={{ color: "var(--danger)" }}>
                  {error}
                </p>
              )}
            </div>

            <form
              className={s.composer}
              onSubmit={e => {
                e.preventDefault();
                void send(draft);
              }}
            >
              <div className={s.composerRow}>
                <Textarea
                  className={s.composerInput}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={socratic ? "Ask, and I'll guide you with questions…" : "Ask anything… (Enter to send, Shift+Enter for a new line)"}
                  rows={2}
                  aria-label="Message the tutor"
                />
                {busy ? (
                  <Button variant="secondary" onClick={() => controller.current?.abort()}>
                    Stop
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" icon={<SendHorizontal size={16} />} disabled={!draft.trim()} aria-label="Send">
                    Send
                  </Button>
                )}
              </div>
              <Switch label="Socratic mode" description="Guide me with questions instead of answers." checked={socratic} onCheckedChange={setSocratic} />
            </form>
          </>
        )}
      </div>
    </Sheet>
  );
}
