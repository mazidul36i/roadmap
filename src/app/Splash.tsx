import { RefreshCw, WifiOff } from "lucide-react";
import { Button, Skeleton } from "@ui/index";
import { BrandMark } from "./BrandMark";
import s from "./AppShell.module.css";

export function LoadingScreen({ label = "Lighting the forge…" }: { label?: string }) {
  return (
    <div className={s.splash} role="status" aria-live="polite">
      <div className={s.splashInner}>
        <BrandMark className={s.splashMark} size={56} />
        <p className="u-muted">{label}</p>
      </div>
    </div>
  );
}

export function LoadErrorScreen({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className={s.splash}>
      <div className={s.splashInner} role="alert">
        <WifiOff size={40} color="var(--warning)" aria-hidden />
        <h1 style={{ fontSize: "var(--fs-2xl)" }}>We couldn't load your data</h1>
        <p className="u-muted">
          Your progress is safe in the cloud. Nothing was changed. Check your connection, then try again.
        </p>
        {message && <code className="u-xs u-faint">{message}</code>}
        <Button variant="primary" icon={<RefreshCw size={16} />} onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

/** Placeholder while a lazily-loaded page arrives. */
export function PageSkeleton() {
  return (
    <div aria-hidden style={{ display: "grid", gap: 16 }}>
      <Skeleton width={220} height={34} />
      <Skeleton width="60%" height={16} />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", marginTop: 16 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={132} radius={16} />
        ))}
      </div>
    </div>
  );
}
