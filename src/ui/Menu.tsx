import type { ReactElement, ReactNode } from "react";
import { DropdownMenu, Popover as RPopover } from "radix-ui";
import { cx } from "./cx";
import s from "./Overlay.module.css";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface MenuProps {
  trigger: ReactElement;
  items: Array<MenuItem | "separator" | { heading: string }>;
  align?: "start" | "center" | "end";
}

/** Overflow / actions menu. Keyboard navigable via Radix. */
export function Menu({ trigger, items, align = "end" }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={s.menu} align={align} sideOffset={6} collisionPadding={8}>
          {items.map((item, i) => {
            if (item === "separator") return <DropdownMenu.Separator key={i} className={s.menuSeparator} />;
            if ("heading" in item)
              return (
                <DropdownMenu.Label key={i} className={s.menuLabel}>
                  {item.heading}
                </DropdownMenu.Label>
              );
            return (
              <DropdownMenu.Item
                key={i}
                className={cx(s.menuItem, item.danger && s.dangerItem)}
                onSelect={item.onSelect}
                disabled={item.disabled}
              >
                {item.icon}
                {item.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

interface PopoverProps {
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export function Popover({ trigger, children, open, onOpenChange, align = "start", side = "bottom" }: PopoverProps) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content className={s.popover} align={align} side={side} sideOffset={8} collisionPadding={12}>
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}
