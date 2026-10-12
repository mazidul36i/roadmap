import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { cx } from "@ui/cx";
import s from "@ui/Feedback.module.css";

export type ToastType = "success" | "error" | "info" | "xp";

interface ToastOptions {
  detail?: string;
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss. Errors stay longer by default. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
  xp: <Sparkles size={16} />,
};

const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", options: ToastOptions = {}) => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, type, ...options }]);
      const duration = options.duration ?? (type === "error" ? 6000 : 4000);
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={s.region} role="status" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.14 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cx(s.toast, s[t.type])}
            >
              <span className={s.toastIcon} aria-hidden>
                {ICONS[t.type]}
              </span>
              <div className={s.toastBody}>
                <div className={s.toastTitle}>{t.message}</div>
                {t.detail && <div className={s.toastDetail}>{t.detail}</div>}
              </div>
              {t.action && (
                <button
                  type="button"
                  className={s.toastAction}
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" className={s.toastClose} onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
