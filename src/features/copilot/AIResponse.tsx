import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Copy, NotebookPen, RefreshCw, Sparkles, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { Button, IconButton } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import type { AiStatus } from "./useAi";
import s from "./Copilot.module.css";

interface AIResponseProps {
  text: string;
  status: AiStatus;
  error?: string | null;
  truncated?: boolean;
  onRetry?: () => void;
  onStop?: () => void;
  /** Title used when the answer is saved as a note. */
  saveTitle?: string;
  thinkingLabel?: string;
  extraActions?: ReactNode;
}

/** Shared display for any streamed AI answer: markdown, stop, retry, copy, save as note, feedback. */
export function AIResponse({ text, status, error, truncated, onRetry, onStop, saveTitle, thinkingLabel = "Thinking", extraActions }: AIResponseProps) {
  const { dispatch } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  if (status === "idle") return null;

  if (status === "error") {
    return (
      <div className={s.error} role="alert">
        <AlertCircle size={16} aria-hidden />
        <div style={{ flex: 1 }}>{error}</div>
        {onRetry && (
          <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  const saveAsNote = () => {
    const now = new Date().toISOString();
    const id = uid();
    dispatch({
      type: "ADD_NOTE",
      note: { id, title: saveTitle || "AI answer", content: text, tags: ["ai"], createdAt: now, updatedAt: now },
    });
    toast("Saved to Notes", "success", { action: { label: "Open", onClick: () => navigate(`/notes/${id}`) } });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={s.response} aria-live="polite" aria-busy={status === "loading" || status === "streaming"}>
      {status === "loading" && (
        <div className={s.thinking}>
          <span className={s.dots} aria-hidden>
            <span />
            <span />
            <span />
          </span>
          {thinkingLabel}…
        </div>
      )}
      {text && <Markdown streaming={status === "streaming"}>{text}</Markdown>}
      {truncated && <p className="u-xs u-faint">The answer hit its length limit. Ask a follow-up to continue.</p>}

      <div className={s.actions}>
        {(status === "loading" || status === "streaming") && onStop && (
          <Button size="sm" variant="ghost" icon={<Square size={12} />} onClick={onStop}>
            Stop
          </Button>
        )}
        {status === "done" && text && (
          <>
            <IconButton size="sm" label={copied ? "Copied" : "Copy answer"} icon={copied ? <Check size={15} /> : <Copy size={15} />} onClick={copy} />
            <IconButton size="sm" label="Save as note" icon={<NotebookPen size={15} />} onClick={saveAsNote} />
            {onRetry && <IconButton size="sm" label="Regenerate" icon={<RefreshCw size={15} />} onClick={onRetry} />}
            <IconButton
              size="sm"
              label="Helpful"
              icon={<ThumbsUp size={15} />}
              aria-pressed={feedback === "up"}
              onClick={() => setFeedback(f => (f === "up" ? null : "up"))}
              style={feedback === "up" ? { color: "var(--success)" } : undefined}
            />
            <IconButton
              size="sm"
              label="Not helpful"
              icon={<ThumbsDown size={15} />}
              aria-pressed={feedback === "down"}
              onClick={() => setFeedback(f => (f === "down" ? null : "down"))}
              style={feedback === "down" ? { color: "var(--danger)" } : undefined}
            />
            {extraActions}
            <span className={s.disclaimer}>
              <Sparkles size={11} style={{ display: "inline", verticalAlign: "-1px" }} aria-hidden /> AI can be wrong. Verify important details.
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** Inline prompt shown where an AI feature would be, when AI is turned off. */
export function AiGate({ children }: { children?: ReactNode }) {
  const { dispatch } = useApp();
  return (
    <div className={s.gate}>
      <Sparkles size={18} aria-hidden />
      <span style={{ flex: 1 }}>{children ?? "The AI co-pilot is off."}</span>
      <Button size="sm" variant="soft" onClick={() => dispatch({ type: "SET_AI_ENABLED", enabled: true })}>
        Turn on
      </Button>
    </div>
  );
}
