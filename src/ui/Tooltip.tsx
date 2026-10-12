import type { ReactElement, ReactNode } from "react";
import { Tooltip as RTooltip } from "radix-ui";
import s from "./Overlay.module.css";

export const TooltipProvider = RTooltip.Provider;

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

/** Hover/focus hint. Never the only place important information lives. */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  if (!content) return children;
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content className={s.tooltip} side={side} sideOffset={6} collisionPadding={8}>
          {content}
          <RTooltip.Arrow className={s.tooltipArrow} />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}
