import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@ui/index";

interface Props {
  children: ReactNode;
  /** Changing this key (e.g. the pathname) resets the boundary. */
  resetKey?: string;
  /** Compact in-page variant instead of a full-screen one. */
  inline?: boolean;
}

interface State {
  error: Error | null;
}

/** Catches render errors so one broken page never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Forge: render error", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: this.props.inline ? 320 : "100dvh",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 520 }}>
          <TriangleAlert size={36} color="var(--warning)" aria-hidden />
          <h2 style={{ fontSize: "var(--fs-xl)" }}>This part of Forge hit a snag</h2>
          <p className="u-muted u-sm">Your data is safe. Reloading usually fixes it.</p>
          <code className="u-xs u-faint" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} data-testid="error-message">
            {error.message}
          </code>
          <Button variant="primary" icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }
}
