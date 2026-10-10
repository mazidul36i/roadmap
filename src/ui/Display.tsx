import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "./cx";
import s from "./Display.module.css";

// ─── Card ──────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "flush" | "compact" | "normal" | "roomy";
  raised?: boolean;
  /** CSS colour (usually a var()) for the accent edge / glow / icons. */
  accent?: string;
  glow?: boolean;
  blueprint?: boolean;
  /** Render as a router link; makes the whole card interactive. */
  to?: string;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "li";
}

export function Card({
  padding = "normal",
  raised,
  accent,
  glow,
  blueprint,
  to,
  interactive,
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: CardProps) {
  const classes = cx(
    s.card,
    padding !== "normal" && s[padding],
    raised && s.raised,
    accent && s.accent,
    glow && s.glow,
    blueprint && s.blueprint,
    (to || interactive) && s.interactive,
    className,
  );
  const merged: CSSProperties = accent ? { ...style, ["--accent" as string]: accent } : style ?? {};
  if (to) {
    return (
      <Link to={to} className={classes} style={merged}>
        {children}
      </Link>
    );
  }
  // Every allowed tag accepts the same HTML attributes we pass through.
  const Element = Tag as "div";
  return (
    <Element className={classes} style={merged} {...rest}>
      {children}
    </Element>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
}

export function CardHeader({ title, icon, subtitle, action, as: H = "h2" }: CardHeaderProps) {
  return (
    <div className={s.cardHeader}>
      <div style={{ minWidth: 0 }}>
        <H className={s.cardTitle}>
          {icon}
          {title}
        </H>
        {subtitle && <p className={s.cardSubtitle}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "xp";

interface BadgeProps {
  tone?: Tone;
  /** Arbitrary colour (e.g. a track var); overrides tone. */
  color?: string;
  icon?: ReactNode;
  outline?: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Badge({ tone = "neutral", color, icon, outline, children, className, title }: BadgeProps) {
  return (
    <span
      className={cx(s.badge, color ? s["tone-custom"] : s[`tone-${tone}`], outline && s.outline, className)}
      style={color ? ({ "--accent": color } as CSSProperties) : undefined}
      title={title}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── Progress ──────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: ReactNode;
  /** Shown on the right; defaults to "value / max". Pass false to hide. */
  valueLabel?: ReactNode | false;
  color?: string;
  height?: number;
  ariaLabel?: string;
}

export function ProgressBar({ value, max = 100, label, valueLabel, color, height, ariaLabel }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const showMeta = label !== undefined || valueLabel !== false;
  return (
    <div className={s.progress}>
      {showMeta && (label !== undefined || valueLabel) && (
        <div className={s.progressMeta}>
          {label !== undefined && <span className={s.progressLabel}>{label}</span>}
          {valueLabel !== false && (
            <span className={s.progressValue}>{valueLabel ?? `${value} / ${max}`}</span>
          )}
        </div>
      )}
      <div
        className={s.track}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        style={{ ["--bar-h" as string]: height ? `${height}px` : undefined } as CSSProperties}
      >
        <div className={s.fill} style={{ width: `${pct}%`, ["--bar-color" as string]: color } as CSSProperties} />
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
  ariaLabel: string;
}

export function ProgressRing({ value, max = 100, size = 96, stroke = 8, color, children, ariaLabel }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      className={s.ring}
      style={{ width: size, height: size, ["--ring-color" as string]: color } as CSSProperties}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} aria-hidden>
        <circle className={s.ringTrack} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className={s.ringFill}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      {children && <div className={s.ringCenter}>{children}</div>}
    </div>
  );
}

// ─── Gem (mastery tier) ────────────────────────────────────────────────────────

export type GemTier = "rough" | "cut" | "polished" | "brilliant";

export const GEM_LABEL: Record<GemTier, string> = {
  rough: "Rough",
  cut: "Cut",
  polished: "Polished",
  brilliant: "Brilliant",
};

export function gemTier(mastery: number): GemTier {
  if (mastery >= 80) return "brilliant";
  if (mastery >= 55) return "polished";
  if (mastery >= 25) return "cut";
  return "rough";
}

export function Gem({ tier, size = 20, title }: { tier: GemTier; size?: number; title?: string }) {
  const color = `var(--gem-${tier})`;
  const facets = tier === "rough" ? 0.35 : tier === "cut" ? 0.6 : tier === "polished" ? 0.85 : 1;
  return (
    <svg
      className={s.gem}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ ["--gem" as string]: color } as CSSProperties}
      role="img"
      aria-label={title ?? `${GEM_LABEL[tier]} gem`}
    >
      <path d="M6 3h12l4 6-10 12L2 9l4-6Z" fill={color} fillOpacity={0.25 + facets * 0.35} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {tier !== "rough" && <path d="M2 9h20M9 3 7.5 9 12 21l4.5-12L15 3" fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" opacity={facets} />}
      {tier === "brilliant" && <circle cx="17.5" cy="5.5" r="1.4" fill="#fff" opacity={0.9} />}
    </svg>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, children, actions, className }: EmptyStateProps) {
  return (
    <div className={cx(s.empty, className)}>
      <div className={s.emptyIcon} aria-hidden>
        {icon}
      </div>
      <h3 className={s.emptyTitle}>{title}</h3>
      {children && <div className={s.emptyBody}>{children}</div>}
      {actions && <div className={s.emptyActions}>{actions}</div>}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ width = "100%", height = 16, radius, className }: { width?: number | string; height?: number | string; radius?: number; className?: string }) {
  return <div className={cx(s.skeleton, className)} style={{ width, height, borderRadius: radius }} aria-hidden />;
}

// ─── Page header ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className={s.pageHeader}>
      <div>
        {eyebrow && <div className="u-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h1 className={s.pageTitle}>{title}</h1>
        {subtitle && <p className={s.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </header>
  );
}

// ─── Kbd ───────────────────────────────────────────────────────────────────────

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={s.kbd}>{children}</kbd>;
}

// ─── Stat tile ─────────────────────────────────────────────────────────────────

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  accent?: string;
}

export function Stat({ label, value, icon, hint, accent }: StatProps) {
  return (
    <div className={s.stat} style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}>
      <div className={s.statTop}>
        {icon && <span className={s.statIcon}>{icon}</span>}
        {label}
      </div>
      <div className={s.statValue}>{value}</div>
      {hint && <div className={s.statHint}>{hint}</div>}
    </div>
  );
}
