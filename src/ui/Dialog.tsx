import type { CSSProperties, ReactNode } from "react";
import { Dialog as RDialog, VisuallyHidden } from "radix-ui";
import { X } from "lucide-react";
import { IconButton } from "./Button";
import { cx } from "./cx";
import s from "./Overlay.module.css";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Hide the visual title but keep it for screen readers. */
  hideTitle?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Modal dialog with focus trap, Esc to close, and a visible close button. */
export function Dialog({ open, onOpenChange, title, description, hideTitle, size = "md", footer, children, className }: DialogProps) {
  const titleNode = <RDialog.Title className={s.dialogTitle}>{title}</RDialog.Title>;
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className={s.backdrop} />
        <RDialog.Content className={cx(s.dialog, s[size], className)}>
          <div className={s.dialogHeader}>
            <div>
              {hideTitle ? <VisuallyHidden.Root>{titleNode}</VisuallyHidden.Root> : titleNode}
              {description ? (
                <RDialog.Description className={s.dialogDescription}>{description}</RDialog.Description>
              ) : (
                <VisuallyHidden.Root>
                  <RDialog.Description>{typeof title === "string" ? title : "Dialog"}</RDialog.Description>
                </VisuallyHidden.Root>
              )}
            </div>
            <RDialog.Close asChild>
              <IconButton label="Close" icon={<X size={18} />} tooltip={false} />
            </RDialog.Close>
          </div>
          <div className={s.dialogBody}>{children}</div>
          {footer && <div className={s.dialogFooter}>{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  side?: "right" | "left";
  width?: number;
  headerExtra?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Keep the page behind interactive (no overlay). */
  modal?: boolean;
}

/** Side drawer (tutor, filters, quick edit). */
export function Sheet({ open, onOpenChange, title, description, side = "right", width, headerExtra, children, footer, modal = true }: SheetProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <RDialog.Portal>
        {modal && <RDialog.Overlay className={s.backdrop} />}
        <RDialog.Content
          className={cx(s.sheet, side === "left" && s.left)}
          style={width ? ({ "--sheet-w": `${width}px` } as CSSProperties) : undefined}
          onInteractOutside={modal ? undefined : e => e.preventDefault()}
        >
          <div className={s.dialogHeader}>
            <div>
              <RDialog.Title className={s.dialogTitle}>{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className={s.dialogDescription}>{description}</RDialog.Description>
              ) : (
                <VisuallyHidden.Root>
                  <RDialog.Description>{typeof title === "string" ? title : "Panel"}</RDialog.Description>
                </VisuallyHidden.Root>
              )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {headerExtra}
              <RDialog.Close asChild>
                <IconButton label="Close" icon={<X size={18} />} tooltip={false} />
              </RDialog.Close>
            </div>
          </div>
          <div className={s.sheetBody}>{children}</div>
          {footer && <div className={s.dialogFooter}>{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
