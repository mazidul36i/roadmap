import { useId } from "react";

/** The Forge mark: an ember flame over the hearth. */
export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  const id = useId();
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC53D" />
          <stop offset="1" stopColor="#FF5A1F" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="var(--surface-3)" />
      <path
        d="M16 4.5c1.3 3.6 5.8 5.9 5.8 11.1A5.8 5.8 0 0 1 16 21.5a5.8 5.8 0 0 1-5.8-5.9c0-2.7 1.5-4.2 2.7-5.6.3 1.7 1.2 2.9 2.3 3.3-.1-3-.2-6.1.8-8.8z"
        fill={`url(#${id}-flame)`}
      />
      <rect x="7.5" y="23.5" width="17" height="3" rx="1.5" fill="#FF7A45" />
    </svg>
  );
}
