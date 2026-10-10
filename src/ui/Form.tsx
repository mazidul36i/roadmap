import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Switch as RSwitch, Tabs as RTabs, ToggleGroup } from "radix-ui";
import { cx } from "./cx";
import s from "./Form.module.css";

// ─── Field ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** A single form control; it receives id / aria wiring automatically. */
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  className?: string;
}

/** Visible label + helper/error text, wired to the control for screen readers. */
export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;
  return (
    <div className={cx(s.field, className)}>
      <label className={s.label} htmlFor={(isValidElement(children) && children.props.id) || id}>
        {label}
        {required && (
          <span className={s.required} aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <span id={hintId} className={s.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={s.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Controls ──────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  inputSize?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon, inputSize = "md", className, ...rest }, ref) {
  const input = <input ref={ref} className={cx(s.control, inputSize === "sm" && s.sm, className)} {...rest} />;
  if (!icon) return input;
  return (
    <div className={s.withIcon}>
      {icon}
      {input}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cx(s.control, className)} {...rest} />;
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<string | { value: string; label: string }>;
  inputSize?: "sm" | "md";
}

/** Native select (best keyboard + mobile behaviour), styled to match. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, inputSize = "md", className, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cx(s.control, inputSize === "sm" && s.sm, className)} {...rest}>
      {options.map(o => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
});

// ─── Switch ────────────────────────────────────────────────────────────────────

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
}

export function Switch({ checked, onCheckedChange, label, description, disabled, hideLabel }: SwitchProps) {
  const id = useId();
  const control = (
    <RSwitch.Root
      id={id}
      className={s.switch}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={hideLabel ? label : undefined}
    >
      <RSwitch.Thumb className={s.switchThumb} />
    </RSwitch.Root>
  );
  if (hideLabel) return control;
  return (
    <div className={s.switchRow}>
      <div>
        <label htmlFor={id} className={s.label}>
          {label}
        </label>
        {description && <div className={s.hint}>{description}</div>}
      </div>
      {control}
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

export interface TabDef {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabDef[];
  children?: ReactNode;
  className?: string;
  label?: string;
}

/** Tabs whose panels are rendered by the caller with <TabPanel value>. */
export function Tabs({ value, onValueChange, tabs, children, className, label }: TabsProps) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RTabs.List className={s.tabList} aria-label={label}>
        {tabs.map(t => (
          <RTabs.Trigger key={t.value} value={t.value} className={s.tab}>
            {t.icon}
            {t.label}
            {typeof t.count === "number" && <span className={s.tabCount}>{t.count}</span>}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {children}
    </RTabs.Root>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <RTabs.Content value={value} className={className} style={{ outline: "none" }}>
      {children}
    </RTabs.Content>
  );
}

// ─── Segmented control ─────────────────────────────────────────────────────────

interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Array<{ value: T; label: ReactNode; icon?: ReactNode }>;
  label: string;
  className?: string;
}

export function Segmented<T extends string>({ value, onValueChange, options, label, className }: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={v => v && onValueChange(v as T)}
      className={cx(s.segmented, className)}
      aria-label={label}
    >
      {options.map(o => (
        <ToggleGroup.Item key={o.value} value={o.value} className={s.segment}>
          {o.icon}
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

// ─── Chip ──────────────────────────────────────────────────────────────────────

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
  icon?: ReactNode;
  style?: CSSProperties;
}

/** Toggleable filter chip (aria-pressed). */
export function Chip({ selected = false, onClick, children, count, icon, style }: ChipProps) {
  return (
    <button type="button" className={s.chip} aria-pressed={selected} onClick={onClick} style={style}>
      {icon}
      {children}
      {typeof count === "number" && <span className={s.chipCount}>{count}</span>}
    </button>
  );
}
