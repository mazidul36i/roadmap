import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertDialog } from "radix-ui";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { Button } from "@ui/Button";
import overlay from "@ui/Overlay.module.css";
import s from "@ui/Feedback.module.css";

export interface ConfirmationOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Legacy callback style; the returned promise is the preferred API. */
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: "danger" | "warning" | "info";
}

interface ConfirmationContextType {
  /** Resolves true when confirmed, false when cancelled or dismissed. */
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

const TONE: Record<NonNullable<ConfirmationOptions["type"]>, { color: string; icon: ReactNode }> = {
  danger: { color: "var(--danger)", icon: <Trash2 size={18} /> },
  warning: { color: "var(--warning)", icon: <AlertTriangle size={18} /> },
  info: { color: "var(--info)", icon: <Info size={18} /> },
};

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const pending = useRef<ConfirmationOptions | null>(null);

  const confirm = useCallback((opt: ConfirmationOptions) => {
    // A new request supersedes an unanswered one.
    resolver.current?.(false);
    pending.current = opt;
    setOptions(opt);
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  /** Idempotent: Radix fires onOpenChange(false) right after an Action click. */
  const settle = (confirmed: boolean) => {
    const resolve = resolver.current;
    const opt = pending.current;
    if (!resolve) return;
    resolver.current = null;
    pending.current = null;
    if (confirmed) opt?.onConfirm?.();
    else opt?.onCancel?.();
    resolve(confirmed);
    setOptions(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);
  const type = options?.type ?? "warning";
  const tone = TONE[type];

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <AlertDialog.Root open={!!options} onOpenChange={open => !open && settle(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={overlay.backdrop} />
          <AlertDialog.Content className={s.confirmContent}>
            <div className={s.confirmRow}>
              <span className={s.confirmIcon} style={{ "--tone": tone.color } as React.CSSProperties} aria-hidden>
                {tone.icon}
              </span>
              <div>
                <AlertDialog.Title className={s.confirmTitle}>{options?.title || "Are you sure?"}</AlertDialog.Title>
                <AlertDialog.Description className={s.confirmMessage}>{options?.message}</AlertDialog.Description>
              </div>
            </div>
            <div className={s.confirmActions}>
              <AlertDialog.Cancel asChild>
                <Button variant="ghost">{options?.cancelText || "Cancel"}</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant={type === "danger" ? "danger" : "primary"} onClick={() => settle(true)}>
                  {options?.confirmText || (type === "danger" ? "Delete" : "Confirm")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmationContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmationProvider");
  return context;
}
