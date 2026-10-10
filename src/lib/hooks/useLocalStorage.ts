import { useCallback, useState } from "react";

/**
 * Per-device UI preference (sidebar collapsed, last tab…). Never use it for
 * data that must sync; that belongs in AppState.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue(prev => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore quota / privacy mode */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
